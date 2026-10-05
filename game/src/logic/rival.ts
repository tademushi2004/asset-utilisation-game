import { type Allocation, type AssetClassId, type Rival, emptyAllocation, INITIAL_COINS, type EventType } from '../types/game';

/**
 * ライバルの初期状態を生成
 */
export function createRivals(): Rival[] {
  return [
    {
      name: 'ライオンのレオン',
      emoji: '🦁',
      avatarUrl: '/avatars/lion.png.jpg',
      description: '肉食獣の頂点。すべてを外国株式（肉）にベット！',
      coins: INITIAL_COINS,
      strategy: 'gambler',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'ゾウのエレファ',
      emoji: '🐘',
      avatarUrl: '/avatars/elephant.png.jpg',
      description: '穏やかな草食獣。預金（水）と債券（草）のみで手堅く生きる。',
      coins: INITIAL_COINS,
      strategy: 'timid',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'シバイヌのシバ',
      emoji: '🐕',
      avatarUrl: '/avatars/shiba.png.jpg',
      description: '普段は賢く分散投資するが、暴落（大きな音）でパニックに！',
      coins: INITIAL_COINS,
      strategy: 'panic',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'フクロウのオウル',
      emoji: '🦉',
      avatarUrl: '/avatars/owl.png.jpg',
      description: '夜の賢者。預金30確保＋残り均等の王道必勝法を貫く。',
      coins: INITIAL_COINS,
      strategy: 'smart',
      panickedLastTurn: false,
      history: [INITIAL_COINS],
    },
    {
      name: 'サルのモンキ',
      emoji: '🐒',
      avatarUrl: '/avatars/monkey.png.jpg',
      description: '前回の値動きをサルマネする順張り投資家',
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
      
    case 'timid': {
      // 預金と債券のみに配分（草食獣）
      const half = Math.floor(coins / 2);
      const quarter = Math.floor(coins / 4);
      alloc.cash = half;
      alloc.domestic_bond = quarter;
      alloc.foreign_bond = coins - half - quarter;
      break;
    }
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
      
    case 'smart': {
      // 預金30確保＋残り均等
      const cashReserve = Math.min(coins, 30);
      alloc.cash = cashReserve;
      const remaining = coins - cashReserve;
      const portion = Math.floor(remaining / 4);
      alloc.domestic_bond = portion;
      alloc.foreign_bond = portion;
      alloc.domestic_stock = portion;
      alloc.foreign_stock = remaining - (portion * 3); // 端数
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
