import type { AssetClassId, PlayerState, Rival } from '../types/game';

// ===== ドリームライフ（資産額ランク）=====
export interface DreamLife {
  title: string;
  emoji: string;
  description: string;
  tier: number; // 0=最高, 4=最低
}

export function getDreamLife(finalCoins: number): DreamLife {
  if (finalCoins >= 300) {
    return { title: '宇宙旅行', emoji: '🚀', description: '宇宙の果てまでも行ける資産を手に入れた！', tier: 0 };
  } else if (finalCoins >= 200) {
    return { title: '南の島生活', emoji: '🏝️', description: '南の島でのんびり暮らせる資産を築いた！', tier: 1 };
  } else if (finalCoins >= 150) {
    return { title: 'マイホーム', emoji: '🏡', description: '念願のマイホームを手に入れた！', tier: 2 };
  } else if (finalCoins >= 100) {
    return { title: '現状維持', emoji: '🏢', description: 'なんとか資産を守り抜いた。', tier: 3 };
  } else {
    return { title: '厳しい生活', emoji: '😰', description: '資産が目減りしてしまった...', tier: 4 };
  }
}

// ===== プレイスタイル称号 =====
export interface PlayStyleTitle {
  title: string;
  subtitle: string;
  emoji: string;
  rank: 'S' | 'A' | 'B' | 'C';
}

/**
 * プレイスタイル称号を判定
 */
export function getPlayStyleTitle(player: PlayerState): PlayStyleTitle {
  const history = player.allocationHistory;
  if (history.length === 0) {
    return { title: '初心者', subtitle: '旅は始まったばかり', emoji: '🐣', rank: 'C' };
  }
  
  const totalTurns = history.length;
  
  // 各ターンの配分比率を分析
  let balancedTurns = 0;
  let coreSatelliteTurns = 0;
  let stockHeavyTurns = 0;
  let cashHeavyTurns = 0;
  let volatileTurns = 0;
  
  for (let i = 0; i < totalTurns; i++) {
    const alloc = history[i];
    const total = Object.values(alloc).reduce((s, v) => s + v, 0);
    
    if (total === 0) continue;
    
    // 各資産の比率を計算
    const ratios: Record<AssetClassId, number> = {} as Record<AssetClassId, number>;
    for (const key of Object.keys(alloc) as AssetClassId[]) {
      ratios[key] = alloc[key] / total;
    }
    
    // バランスチェック: 全5資産が12%〜28%以内
    const isBalanced = Object.values(ratios).every(r => r >= 0.12 && r <= 0.28);
    if (isBalanced) balancedTurns++;
    
    // コア・サテライト戦略チェック: 預金が固定(15〜60)で、残りを4分割している
    const cashAmt = alloc['cash'] || 0;
    const investedTotal = total - cashAmt;
    let isCoreSatellite = false;
    if (cashAmt >= 15 && cashAmt <= 60 && investedTotal > 0) {
      isCoreSatellite = Object.entries(alloc)
        .filter(([k]) => k !== 'cash')
        .every(([, v]) => {
          const r = v / investedTotal;
          return r >= 0.15 && r <= 0.35; // 投資部分の15%〜35%（均等なら25%）
        });
    }
    if (isCoreSatellite) coreSatelliteTurns++;
    
    // 株式偏重チェック: 株式合計が70%以上
    const stockRatio = (ratios.domestic_stock || 0) + (ratios.foreign_stock || 0);
    if (stockRatio >= 0.70) stockHeavyTurns++;
    
    // 預金偏重チェック: 預金が70%以上
    if ((ratios.cash || 0) >= 0.70) cashHeavyTurns++;
    
    // 配分変動チェック（前ターンとの差分）
    if (i > 0) {
      const prev = history[i - 1];
      const prevTotal = Object.values(prev).reduce((s, v) => s + v, 0);
      if (prevTotal > 0) {
        let diffSum = 0;
        for (const key of Object.keys(alloc) as AssetClassId[]) {
          const currR = alloc[key] / total;
          const prevR = prev[key] / prevTotal;
          diffSum += Math.abs(currR - prevR);
        }
        if (diffSum > 0.8) volatileTurns++;
      }
    }
  }
  
  // 称号判定（優先順位順）
  const coreSatelliteRatio = coreSatelliteTurns / totalTurns;
  const balanceRatio = balancedTurns / totalTurns;
  
  if (coreSatelliteRatio >= 0.7) {
    return {
      title: '至高の特上松花堂弁当',
      subtitle: 'コア・サテライト運用を極めた真のマスター',
      emoji: '👑',
      rank: 'S',
    };
  }
  
  if (balanceRatio >= 0.7) {
    return {
      title: '三ツ星の幕の内職人',
      subtitle: '伝説の弁当マスター',
      emoji: '⭐',
      rank: 'S',
    };
  }
  
  if (volatileTurns / Math.max(1, totalTurns - 1) >= 0.5) {
    return {
      title: '弁当ひっくり返し魔',
      subtitle: '毎回違うメニューで周囲を振り回す',
      emoji: '🌪️',
      rank: 'B',
    };
  }
  
  if (stockHeavyTurns / totalTurns >= 0.5) {
    return {
      title: '胃もたれ焼肉大王',
      subtitle: 'お肉への情熱は誰にも止められない',
      emoji: '🥩',
      rank: 'A',
    };
  }
  
  if (cashHeavyTurns / totalTurns >= 0.5) {
    return {
      title: '水飲み修行僧',
      subtitle: '安全第一、石橋を叩いて渡る達人',
      emoji: '🧘',
      rank: 'A',
    };
  }
  
  return {
    title: 'まちまち弁当師',
    subtitle: '独自のスタイルで資産運用を楽しんだ',
    emoji: '🍱',
    rank: 'B',
  };
}

/**
 * 最終順位を計算
 */
export function getFinalRankings(
  playerCoins: number,
  rivals: Rival[]
): { name: string; emoji: string; coins: number; isPlayer: boolean }[] {
  const entries = [
    { name: 'あなた', emoji: '🙂', coins: playerCoins, isPlayer: true },
    ...rivals.map(r => ({ name: r.name, emoji: r.emoji, coins: r.coins, isPlayer: false })),
  ];
  return entries.sort((a, b) => b.coins - a.coins);
}
