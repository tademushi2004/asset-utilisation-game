import { ASSET_CLASSES, type AssetClassId, type EventType, type MarketEvent, type Allocation } from '../types/game';

// Box-Muller法による正規分布乱数
function normalRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * 1ターン分の各資産の変動率を計算
 * 王道の分散投資が最適になるよう、株式間に正の相関を持たせる
 */
export function calculateMarketRates(
  event: EventType
): Record<AssetClassId, number> {
  const rates: Partial<Record<AssetClassId, number>> = {};
  
  // 共通の市場ファクター（株式間の相関を作る）
  const marketFactor = normalRandom();
  
  for (const asset of ASSET_CLASSES) {
    let rate: number;
    
    if (asset.riskRange === 0) {
      // 預金は変動なし（イベント補正のみ）
      rate = asset.baseReturn;
    } else {
      // 個別のランダム成分
      const idioRandom = normalRandom();
      // 株式は市場ファクターとの相関を強くする（分散投資の効果を際立たせる）
      const correlation = (asset.id === 'domestic_stock' || asset.id === 'foreign_stock') ? 0.6 : 0.3;
      const combinedRandom = correlation * marketFactor + Math.sqrt(1 - correlation * correlation) * idioRandom;
      
      // 基準リターン + リスク幅内のランダム値（1σ = riskRange/2 で正規分布）
      rate = asset.baseReturn + (asset.riskRange / 2) * combinedRandom;
    }
    
    rates[asset.id] = rate;
  }
  
  // イベント補正
  if (event === 'CRASH') {
    // 大暴落: 株式を -30% 〜 -50% に強制
    rates.domestic_stock = -(0.30 + Math.random() * 0.20);
    rates.foreign_stock = -(0.30 + Math.random() * 0.20);
  } else if (event === 'INFLATION') {
    // インフレの波: 預金を -5% に強制
    rates.cash = -0.05;
  } else if (event === 'BOOM') {
    // 好景気ブーム: 株式に +10% ボーナス
    rates.domestic_stock = (rates.domestic_stock || 0) + 0.10;
    rates.foreign_stock = (rates.foreign_stock || 0) + 0.10;
  }
  
  return rates as Record<AssetClassId, number>;
}

/**
 * 配分に対して変動率を適用し、新しい総資産を計算
 */
export function applyRates(
  allocation: Allocation,
  rates: Record<AssetClassId, number>
): number {
  let total = 0;
  for (const assetId of Object.keys(allocation) as AssetClassId[]) {
    const coins = allocation[assetId];
    const rate = rates[assetId];
    total += coins * (1 + rate);
  }
  return Math.max(0, Math.round(total * 100) / 100);
}

/**
 * イベントスケジュールを事前生成（20ターン分）
 */
export function generateEventSchedule(maxTurns: number): EventType[] {
  const schedule: EventType[] = new Array(maxTurns).fill(null);
  
  // 大暴落: 1〜2回、ターン5〜18の範囲で発生
  const crashCount = 1 + Math.floor(Math.random() * 2); // 1 or 2
  const usedTurns = new Set<number>();
  for (let i = 0; i < crashCount; i++) {
    let t: number;
    do {
      t = 4 + Math.floor(Math.random() * 14); // index 4-17 = turn 5-18
    } while (usedTurns.has(t));
    usedTurns.add(t);
    schedule[t] = 'CRASH';
  }
  
  // インフレの波: 3〜5ターン間隔で定期的に発生
  let nextInflation = 2 + Math.floor(Math.random() * 3); // 最初はターン3-5あたり
  while (nextInflation < maxTurns) {
    if (schedule[nextInflation] === null) {
      schedule[nextInflation] = 'INFLATION';
    }
    nextInflation += 3 + Math.floor(Math.random() * 3); // 3-5ターン間隔
  }
  
  // 好景気ブーム: 2〜3回
  const boomCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < boomCount; i++) {
    let t: number;
    let tries = 0;
    do {
      t = 1 + Math.floor(Math.random() * (maxTurns - 2));
      tries++;
    } while (schedule[t] !== null && tries < 50);
    if (schedule[t] === null) {
      schedule[t] = 'BOOM';
    }
  }
  
  return schedule;
}

/**
 * イベントタイプからMarketEventオブジェクトを生成
 */
export function createMarketEvent(type: EventType): MarketEvent | null {
  if (!type) return null;
  
  const crashNames = ['リーマンショック級', 'コロナショック級', 'バブル崩壊級', 'ブラックマンデー級'];
  
  switch (type) {
    case 'CRASH':
      return {
        type: 'CRASH',
        name: `${crashNames[Math.floor(Math.random() * crashNames.length)]}の大暴落！`,
        description: '国内・外国株式が大暴落！ -30%〜-50%の損失が発生します！',
        emoji: '💥',
      };
    case 'INFLATION':
      return {
        type: 'INFLATION',
        name: 'インフレの波が到来！',
        description: '物価上昇により預金の価値が-5%目減りします...',
        emoji: '🌊',
      };
    case 'BOOM':
      return {
        type: 'BOOM',
        name: '好景気ブーム到来！',
        description: '景気拡大！ 株式に+10%のボーナスが付きます！',
        emoji: '🎉',
      };
    default:
      return null;
  }
}

/**
 * 資産の価格インデックスを更新（チャート用）
 * 初期値100を基準とした累積変動
 */
export function updatePriceIndex(
  currentIndex: number,
  rate: number
): number {
  return Math.max(0, Math.round(currentIndex * (1 + rate) * 100) / 100);
}
