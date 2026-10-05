import { useReducer, useCallback } from 'react';
import {
  type GameState,
  type GamePhase,
  type AssetClassId,
  type Allocation,
  type TurnResult,
  type EventHistoryEntry,
  type LifeEvent,
  ASSET_CLASSES,
  INITIAL_COINS,
  MAX_TURNS,
  LIFE_EVENTS,
  LIFE_EVENT_CASH_THRESHOLD,
  emptyAllocation,
} from '../types/game';
import { calculateMarketRates, generateEventSchedule, createMarketEvent, applyRates, updatePriceIndex } from '../logic/market';
import { createRivals, updateRivalCoins } from '../logic/rival';

// ===== Actions =====
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'ALLOCATE'; assetId: AssetClassId; amount: number }
  | { type: 'END_TURN' }
  | { type: 'COLLECTION_DONE' }
  | { type: 'RACE_DONE' }
  | { type: 'REPEAT_ALLOCATION' }
  | { type: 'RESET' };

// ===== Initial State =====
function createInitialState(): GameState {
  const assetIds = ASSET_CLASSES.map(a => a.id);
  const marketHistory: Record<AssetClassId, number[]> = {} as Record<AssetClassId, number[]>;
  for (const id of assetIds) {
    marketHistory[id] = [100]; // 初期価格インデックス = 100
  }
  
  return {
    phase: 'TITLE',
    turn: 1,
    maxTurns: MAX_TURNS,
    player: {
      coins: INITIAL_COINS,
      allocation: emptyAllocation(),
      wallet: INITIAL_COINS,
      history: [INITIAL_COINS],
      allocationHistory: [],
      targetRatios: null,
    },
    rivals: createRivals(),
    marketHistory,
    turnResults: [],
    currentEvent: null,
    eventSchedule: generateEventSchedule(MAX_TURNS),
    currentRates: null,
    eventHistory: [],
    currentLifeEvent: null,
    lifeEventPenalty: 0,
  };
}

/**
 * ライフイベントの判定
 * 預金への配分がしきい値未満の場合、一定確率で発生
 */
function checkLifeEvent(cashAllocation: number, turn: number): { lifeEvent: LifeEvent | null; penalty: number } {
  // ターン1では発生しない
  if (turn <= 1) return { lifeEvent: null, penalty: 0 };
  
  // 20%の確率でライフイベント発生
  if (Math.random() > 0.20) return { lifeEvent: null, penalty: 0 };
  
  const lifeEvent = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
  
  if (cashAllocation >= lifeEvent.cost) {
    // 預金で賄える → 資産は減らさず、助かったという演出のみにする（ライバルと条件を合わせるため）
    return { lifeEvent, penalty: 0 };
  } else {
    // 預金不足 → 緊急借入で総資産にペナルティ
    return { lifeEvent, penalty: -1 }; // -1 = 預金不足フラグ
  }
}

// ===== Reducer =====
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const freshState = createInitialState();
      return {
        ...freshState,
        phase: 'ALLOCATION',
      };
    }
    
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    
    case 'ALLOCATE': {
      const { assetId, amount } = action;
      const currentAlloc = state.player.allocation[assetId];
      const currentWallet = state.player.wallet;
      
      // amount > 0: ウォレットからスロットへ
      // amount < 0: スロットからウォレットへ
      let actualMove = amount;
      if (amount > 0) {
        actualMove = Math.min(amount, currentWallet);
      } else {
        actualMove = Math.max(amount, -currentAlloc);
      }
      
      if (actualMove === 0) return state;
      
      const newAllocation: Allocation = {
        ...state.player.allocation,
        [assetId]: currentAlloc + actualMove,
      };
      
      return {
        ...state,
        player: {
          ...state.player,
          allocation: newAllocation,
          wallet: currentWallet - actualMove,
          targetRatios: null,
        },
      };
    }
    
    case 'REPEAT_ALLOCATION': {
      if (state.turn <= 1) return state;
      const lastAllocation = state.player.allocationHistory[state.turn - 2];
      const lastTotal = Object.values(lastAllocation).reduce((sum, val) => sum + val, 0);
      if (lastTotal <= 0) return state;
      
      const targetRatios: Record<string, number> = state.player.targetRatios || {};
      if (!state.player.targetRatios) {
        for (const assetId of Object.keys(lastAllocation) as AssetClassId[]) {
          targetRatios[assetId] = lastAllocation[assetId] / lastTotal;
        }
      }
      
      const currentCoins = state.player.coins;
      const newAllocation = emptyAllocation();
      let totalAllocated = 0;
      
      const exactAmounts: Record<string, number> = {};
      const assetIds = Object.keys(newAllocation) as AssetClassId[];
      
      for (const assetId of assetIds) {
        const ratio = targetRatios[assetId];
        const exact = currentCoins * ratio;
        exactAmounts[assetId] = exact;
        const amt = Math.floor(exact);
        newAllocation[assetId] = amt;
        totalAllocated += amt;
      }
      
      const remainder = currentCoins - totalAllocated;
      
      // 端数をLargest Remainder Method（最大剰余方式）で分配する
      const sortedAssetIds = [...assetIds].sort((a, b) => {
        const fracA = exactAmounts[a] - newAllocation[a];
        const fracB = exactAmounts[b] - newAllocation[b];
        return fracB - fracA;
      });
      
      for (let i = 0; i < remainder; i++) {
        newAllocation[sortedAssetIds[i]] += 1;
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          allocation: newAllocation,
          wallet: 0, 
          targetRatios: targetRatios as Record<AssetClassId, number>,
        }
      };
    }
    
    case 'END_TURN': {
      // ターン終了: 市場変動を計算
      const turnIndex = state.turn - 1; // 0-indexed
      const eventType = state.eventSchedule[turnIndex];
      const event = createMarketEvent(eventType);
      const rates = calculateMarketRates(eventType);
      
      // ライフイベント判定
      const cashAlloc = state.player.allocation.cash;
      const { lifeEvent, penalty } = checkLifeEvent(cashAlloc, state.turn);
      
      // プレイヤーの資産を計算（市場変動を適用）
      const playerBefore = state.player.coins;
      let playerAfter = Math.round(applyRates(state.player.allocation, rates));
      
      // ライフイベントのペナルティ適用
      let actualPenalty = 0;
      if (lifeEvent) {
        if (penalty === -1) {
          // 預金不足 → 破産ダメージとして多大な金額を失うか、全額失うか。
          // ここは要件に合わせて「全資産の50%」か「固定大ダメージ」などにするか…
          // 破産してゲームオーバーになるように、例えば「総資産の半分＋固定ダメージ100」とか
          actualPenalty = Math.round(playerAfter * 0.50) + 30; // 確実に大きなダメージを与え、初期資金くらいなら破産しやすくする
          playerAfter = playerAfter - actualPenalty;
        } else {
          // 預金で賄える → コスト分だけ差し引く
          actualPenalty = penalty;
          playerAfter = playerAfter - actualPenalty;
        }
      }
      
      // ライバルの資産を更新
      const lastEvent = turnIndex > 0 ? state.eventSchedule[turnIndex - 1] : null;
      const lastRates = turnIndex > 0 ? state.turnResults[turnIndex - 1].rates : null;
      const updatedRivals = state.rivals.map(rival => 
        updateRivalCoins(rival, rates, lastEvent, lastRates)
      );
      
      // 市場価格インデックスを更新
      const newMarketHistory = { ...state.marketHistory };
      for (const asset of ASSET_CLASSES) {
        const lastIndex = newMarketHistory[asset.id][newMarketHistory[asset.id].length - 1];
        newMarketHistory[asset.id] = [
          ...newMarketHistory[asset.id],
          updatePriceIndex(lastIndex, rates[asset.id]),
        ];
      }
      
      // イベント履歴に追加
      const newEventHistory = [...state.eventHistory];
      if (event) {
        newEventHistory.push({ turn: state.turn, event });
      }
      if (lifeEvent) {
        const lifeEventEntry: EventHistoryEntry = {
          turn: state.turn,
          event: {
            type: 'LIFE_EVENT',
            name: lifeEvent.name,
            description: penalty === -1
              ? `${lifeEvent.description}。預金不足により、ペナルティとして ${actualPenalty} コインを失った！`
              : `${lifeEvent.description}。預金から ${actualPenalty} コインを支払った。`,
            emoji: lifeEvent.emoji,
          },
        };
        newEventHistory.push(lifeEventEntry);
      }
      
      // ターン結果を記録
      const turnResult: TurnResult = {
        turn: state.turn,
        rates,
        event,
        lifeEvent,
        lifeEventPenalty: actualPenalty,
        playerBefore,
        playerAfter,
        rivalsBefore: state.rivals.map(r => r.coins),
        rivalsAfter: updatedRivals.map(r => r.coins),
      };
      
      return {
        ...state,
        phase: 'MARKET_RACE',
        currentEvent: event,
        currentRates: rates,
        currentLifeEvent: lifeEvent,
        lifeEventPenalty: actualPenalty,
        player: {
          ...state.player,
          coins: playerAfter,
          history: [...state.player.history, playerAfter],
          allocationHistory: [...state.player.allocationHistory, { ...state.player.allocation }],
        },
        rivals: updatedRivals,
        marketHistory: newMarketHistory,
        turnResults: [...state.turnResults, turnResult],
        eventHistory: newEventHistory,
      };
    }
    
    case 'RACE_DONE': {
      // レース演出完了
      if (state.turn >= state.maxTurns) {
        return { ...state, phase: 'RESULT', currentLifeEvent: null, lifeEventPenalty: 0 };
      }
      return {
        ...state,
        phase: 'COLLECTION',
        turn: state.turn + 1,
        currentLifeEvent: null,
        lifeEventPenalty: 0,
      };
    }
    
    case 'COLLECTION_DONE': {
      // 回収フェーズ完了 → 配分フェーズへ
      return {
        ...state,
        phase: 'ALLOCATION',
        player: {
          ...state.player,
          allocation: emptyAllocation(),
          wallet: state.player.coins,
        },
        currentEvent: null,
        currentRates: null,
      };
    }
    
    case 'RESET':
      return createInitialState();
    
    default:
      return state;
  }
}

// ===== Hook =====
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const allocate = useCallback((assetId: AssetClassId, amount: number) => 
    dispatch({ type: 'ALLOCATE', assetId, amount }), []);
  const endTurn = useCallback(() => dispatch({ type: 'END_TURN' }), []);
  const raceDone = useCallback(() => dispatch({ type: 'RACE_DONE' }), []);
  const collectionDone = useCallback(() => dispatch({ type: 'COLLECTION_DONE' }), []);
  const repeatAllocation = useCallback(() => dispatch({ type: 'REPEAT_ALLOCATION' }), []);
  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);
  
  return {
    state,
    startGame,
    allocate,
    endTurn,
    raceDone,
    collectionDone,
    repeatAllocation,
    resetGame,
  };
}
