import { type Allocation, type AssetClassId, type Rival, emptyAllocation, INITIAL_COINS, type EventType } from '../types/game';

/**
 * ライバルの初期状態を生成
 */
export function createRivals(): Rival[] {
  return [
    {
      name: 'ギャンブラー・ケン',
      emoji: '🎰',
      description: '外国株式に全額ベット！',
      coins: INITIAL_COINS,
      strategy: 'gambler',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'ビビりのカメオ',
      emoji: '🐢',
      description: '預金に全額ベット！',
      coins: INITIAL_COINS,
      strategy: 'timid',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'パニックのロウ',
      emoji: '😱',
      description: 'バランス型（暴落でパニック）',
      coins: INITIAL_COINS,
      strategy: 'panic',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'ランダムのラン',
      emoji: '🎲',
      description: '毎ターン完全にランダムに配分！',
      coins: INITIAL_COINS,
      strategy: 'random',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'データのデイブ',
      emoji: '💻',
      description: '前回の値動きを信じる順張り投資家',
      coins: INITIAL_COINS,
      strategy: 'data',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
  ];
}

/**
 * ライバルの配分を決定する（純粋関数）
 */
export function getRivalAllocation(rival: Rival, lastEvent: EventType, lastRates: Record<AssetClassId, number> | null): Allocation {
  const alloc = emptyAllocation();
  const coins = rival.coins;
  
  switch (rival.strategy) {
    case 'gambler':
      // 全額を外国株式に
      alloc.foreign_stock = coins;
      break;
      
    case 'timid':
      // 全額を預金に
      alloc.cash = coins;
      break;
      
    case 'panic': {
      // 前ターンで大暴落が発生した場合、パニックで預金に全額避難
      if (lastEvent === 'CRASH') {
        alloc.cash = coins;
      } else {
        // ロウはビビり気味なので、預金を多くし、残りを適当に分配（ナーフ）
        const cashPortion = Math.round(coins * (0.3 + Math.random() * 0.3)); // 30%~60% cash
        const remaining = coins - cashPortion;
        const bondPortion = Math.round(remaining * 0.6); // 残りの6割を国内債券
        alloc.cash = cashPortion;
        alloc.domestic_bond = bondPortion;
        alloc.domestic_stock = remaining - bondPortion; // 残りの4割を国内株式（外国株式は買わない）
      }
      break;
    }
      
    case 'random': {
      const weights = {
        cash: Math.random(),
        domestic_bond: Math.random(),
        foreign_bond: Math.random(),
        domestic_stock: Math.random(),
        foreign_stock: Math.random(),
      };
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      let allocated = 0;
      const assetIds = Object.keys(weights) as AssetClassId[];
      for (let i = 0; i < assetIds.length - 1; i++) {
        const id = assetIds[i];
        const amount = Math.floor(coins * (weights[id] / totalWeight));
        alloc[id] = amount;
        allocated += amount;
      }
      alloc[assetIds[assetIds.length - 1]] = coins - allocated; // 端数
      break;
    }
      
    case 'data': {
      if (!lastRates) {
        // 初回は均等配分
        const avg = Math.floor(coins / 5);
        alloc.cash = avg;
        alloc.domestic_bond = avg;
        alloc.foreign_bond = avg;
        alloc.domestic_stock = avg;
        alloc.foreign_stock = coins - (avg * 4);
      } else {
        // 各領域の前回の値動き率(%) + 100 の重みに基づいて配分
        const weights: Record<AssetClassId, number> = {
          cash: Math.max(0, 100 + (lastRates.cash * 100)),
          domestic_bond: Math.max(0, 100 + (lastRates.domestic_bond * 100)),
          foreign_bond: Math.max(0, 100 + (lastRates.foreign_bond * 100)),
          domestic_stock: Math.max(0, 100 + (lastRates.domestic_stock * 100)),
          foreign_stock: Math.max(0, 100 + (lastRates.foreign_stock * 100)),
        };
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let allocated = 0;
        const assetIds = Object.keys(weights) as AssetClassId[];
        for (let i = 0; i < assetIds.length - 1; i++) {
          const id = assetIds[i];
          const amount = Math.floor(coins * (weights[id] / totalWeight));
          alloc[id] = amount;
          allocated += amount;
        }
        alloc[assetIds[assetIds.length - 1]] = coins - allocated;
      }
      break;
    }
  }
  
  return alloc;
}

/**
 * ライバルの資産を変動率に基づいて更新
 */
export function updateRivalCoins(
  rival: Rival,
  rates: Record<AssetClassId, number>,
  lastEvent: EventType,
  lastRates: Record<AssetClassId, number> | null
): Rival {
  const allocation = getRivalAllocation(rival, lastEvent, lastRates);
  
  let newCoins = 0;
  for (const assetId of Object.keys(allocation) as AssetClassId[]) {
    const coinCount = allocation[assetId];
    const rate = rates[assetId];
    newCoins += coinCount * (1 + rate);
  }
  newCoins = Math.max(0, Math.round(newCoins * 100) / 100);
  
  return {
    ...rival,
    coins: newCoins,
    panickedLastTurn: lastEvent === 'CRASH',
    history: [...rival.history, newCoins],
  };
}
