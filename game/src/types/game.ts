// ===== 資産クラス定義 =====
export type AssetClassId = 'cash' | 'domestic_bond' | 'foreign_bond' | 'domestic_stock' | 'foreign_stock';

export interface AssetClassDef {
  id: AssetClassId;
  name: string;
  emoji: string;
  baseReturn: number;   // 基準リターン (例: 0.08 = +8%)
  riskRange: number;    // リスク幅 (例: 0.20 = ±20%)
  color: string;
  description: string;
}

// ★パラメータ調整: 外国株式のリスクを上げ、基準リターンを微調整
export const ASSET_CLASSES: AssetClassDef[] = [
  { id: 'cash',           name: '預金（水）',   emoji: '💧', baseReturn: 0.00, riskRange: 0.00, color: '#4FC3F7', description: '絶対に減らないがインフレに弱い' },
  { id: 'domestic_bond',  name: '国内債券',     emoji: '🥬', baseReturn: 0.05, riskRange: 0.03, color: '#81C784', description: 'ディフェンスの要' },
  { id: 'foreign_bond',   name: '外国債券',     emoji: '🥦', baseReturn: 0.07, riskRange: 0.08, color: '#FFB74D', description: 'ミドルリスク' },
  { id: 'domestic_stock',  name: '国内株式',     emoji: '🥩', baseReturn: 0.09, riskRange: 0.18, color: '#E57373', description: '成長エンジン' },
  { id: 'foreign_stock',  name: '外国株式',     emoji: '🍖', baseReturn: 0.12, riskRange: 0.40, color: '#BA68C8', description: 'ハイリスク・ハイリターン' },
];

export function getAssetDef(id: AssetClassId): AssetClassDef {
  return ASSET_CLASSES.find(a => a.id === id)!;
}

// ===== ゲームフェーズ =====
export type GamePhase = 'TITLE' | 'COLLECTION' | 'ALLOCATION' | 'MARKET_RACE' | 'RESULT';

// ===== 配分 (5資産への割り振り) =====
export type Allocation = Record<AssetClassId, number>;

export function emptyAllocation(): Allocation {
  return { cash: 0, domestic_bond: 0, foreign_bond: 0, domestic_stock: 0, foreign_stock: 0 };
}

export function totalAllocated(alloc: Allocation): number {
  return Object.values(alloc).reduce((s, v) => s + v, 0);
}

// ===== ランダムイベント =====
export type EventType = 'CRASH' | 'INFLATION' | 'BOOM' | 'LIFE_EVENT' | null;

export interface MarketEvent {
  type: EventType;
  name: string;
  description: string;
  emoji: string;
}

// ===== ライフイベント =====
export interface LifeEvent {
  name: string;
  emoji: string;
  description: string;
  cost: number;          // 必要な預金額
}

export const LIFE_EVENTS: LifeEvent[] = [
  { name: '車の修理', emoji: '🚗', description: '車が故障！ 修理費が必要です', cost: 8 },
  { name: '引っ越し', emoji: '🏠', description: '急な引っ越し！ 費用がかかります', cost: 10 },
  { name: '医療費', emoji: '🏥', description: '体調を崩して入院！ 医療費が必要です', cost: 12 },
  { name: '家電の故障', emoji: '🔧', description: '冷蔵庫が壊れた！ 買い替えが必要です', cost: 6 },
  { name: '冠婚葬祭', emoji: '💐', description: '友人の結婚式！ ご祝儀が必要です', cost: 5 },
];

// ===== イベント履歴エントリ =====
export interface EventHistoryEntry {
  turn: number;
  event: MarketEvent;
}

// ===== ターン結果 =====
export interface TurnResult {
  turn: number;
  rates: Record<AssetClassId, number>;      // 各資産の変動率
  event: MarketEvent | null;
  lifeEvent: LifeEvent | null;              // ★ライフイベント
  lifeEventPenalty: number;                 // ★ペナルティ額
  playerBefore: number;
  playerAfter: number;
  rivalsBefore: number[];
  rivalsAfter: number[];
}

// ===== ライバル =====
export interface Rival {
  name: string;
  emoji: string;
  avatarUrl?: string;
  description: string;
  coins: number;
  strategy: 'gambler' | 'timid' | 'panic' | 'smart' | 'data';
  panickedLastTurn: boolean;  // パニックのロウ用
  history: number[];          // 各ターン終了時の資産推移
}

/**
 * ライバルの配分戦略の説明テキストを取得
 */
export function getRivalStrategyLabel(rival: Rival, lastEvent: EventType): string {
  switch (rival.strategy) {
    case 'gambler':
      return '外国株式 100%';
    case 'timid':
      return '預金 100%';
    case 'panic':
      if (lastEvent === 'CRASH') {
        return '😰 パニック → 預金 100%';
      }
      return '国内株 25% / 外国株 25% / 国内債 25% / 外国債 25%';
    case 'smart':
      return '🦉 預金30確保＋残り均等の王道必勝法';
    case 'data':
      return '💻 前回の値動きに応じたマルコフ順張り戦略';
  }
}

// ===== プレイヤー =====
export interface PlayerState {
  coins: number;              // 手持ちの総コイン（整数）
  allocation: Allocation;     // 現在の配分
  wallet: number;             // 未配分のコイン
  history: number[];          // 各ターン終了時の資産推移
  allocationHistory: Allocation[];  // 各ターンの配分記録（称号判定用）
  targetRatios: Record<AssetClassId, number> | null; // 前回比率配分用の目標比率
}

// ===== ゲーム全体状態 =====
export interface GameState {
  phase: GamePhase;
  turn: number;               // 1-indexed, 最大20
  maxTurns: number;
  player: PlayerState;
  rivals: Rival[];
  marketHistory: Record<AssetClassId, number[]>;  // 各資産の価格推移 (index=turn)
  turnResults: TurnResult[];
  currentEvent: MarketEvent | null;
  eventSchedule: EventType[];  // 各ターンのイベントスケジュール (pre-generated)
  currentRates: Record<AssetClassId, number> | null; // 市場変動フェーズの結果
  eventHistory: EventHistoryEntry[];  // ★イベント履歴
  currentLifeEvent: LifeEvent | null; // ★現在のライフイベント
  lifeEventPenalty: number;           // ★ライフイベントペナルティ
}

// ===== 初期値 =====
export const INITIAL_COINS = 100;
export const MAX_TURNS = 20;
export const LIFE_EVENT_CASH_THRESHOLD = 10; // 預金がこの額未満だとペナルティ
