import { ASSET_CLASSES, LIFE_EVENTS } from '../src/types/game';
import { calculateMarketRates, generateEventSchedule } from '../src/logic/market';
import { createRivals, updateRivalCoins } from '../src/logic/rival';

// 王道プレイヤーのロジック（等分）
function getRoyalAllocation(coins: number) {
  const avg = Math.floor(coins / 5);
  return {
    cash: avg,
    domestic_bond: avg,
    foreign_bond: avg,
    domestic_stock: avg,
    foreign_stock: coins - (avg * 4)
  };
}

// ライフイベント判定モック
function checkLifeEvent(cashAllocation: number, turn: number) {
  if (turn <= 1) return { penalty: 0 };
  if (Math.random() > 0.20) return { penalty: 0 };
  const lifeEvent = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
  if (cashAllocation >= lifeEvent.cost) {
    return { penalty: lifeEvent.cost };
  } else {
    return { penalty: -1 };
  }
}

function runSimulation() {
  const maxTurns = 20;
  let playerCoins = 100;
  let rivals = createRivals();
  
  const schedule = generateEventSchedule(maxTurns);
  let lastRates = null;
  let isBankrupt = false;
  
  for (let turn = 1; turn <= maxTurns; turn++) {
    const eventType = schedule[turn - 1];
    const rates = calculateMarketRates(eventType);
    const alloc = getRoyalAllocation(playerCoins);
    
    // プレイヤーの更新
    const { penalty } = checkLifeEvent(alloc.cash, turn);
    let newPlayerCoins = 0;
    for (const [asset, amount] of Object.entries(alloc)) {
      newPlayerCoins += amount * (1 + (rates as any)[asset]);
    }
    newPlayerCoins = Math.round(newPlayerCoins);
    
    if (penalty === -1) {
      newPlayerCoins = newPlayerCoins - (Math.round(newPlayerCoins * 0.50) + 30);
    } else {
      newPlayerCoins = newPlayerCoins - penalty;
    }
    
    if (newPlayerCoins <= 0) {
      isBankrupt = true;
      playerCoins = 0;
      break;
    }
    playerCoins = newPlayerCoins;
    
    // ライバルの更新
    const lastEvent = turn > 1 ? schedule[turn - 2] : null;
    rivals = rivals.map(r => updateRivalCoins(r, rates, lastEvent, lastRates));
    
    lastRates = rates;
  }
  
  return {
    player: playerCoins,
    rivals: rivals.map(r => ({ name: r.name, coins: r.coins })),
    isBankrupt
  };
}

const N = 1000;
let playerWins = 0;
let rivalWins = [0, 0, 0, 0, 0];
let bankruptcies = 0;

for (let i = 0; i < N; i++) {
  const res = runSimulation();
  if (res.isBankrupt) {
    bankruptcies++;
    continue;
  }
  
  let isPlayerWon = true;
  for (let j = 0; j < res.rivals.length; j++) {
    if (res.rivals[j].coins >= res.player) {
      isPlayerWon = false;
      break;
    }
  }
  
  if (isPlayerWon) {
    playerWins++;
  } else {
    // 誰が一番か
    let maxCoin = res.player;
    let winnerIdx = -1;
    for (let j = 0; j < res.rivals.length; j++) {
      if (res.rivals[j].coins > maxCoin) {
        maxCoin = res.rivals[j].coins;
        winnerIdx = j;
      }
    }
    if (winnerIdx !== -1) {
      rivalWins[winnerIdx]++;
    }
  }
}

console.log(`Runs: ${N}`);
console.log(`Player (Royal Road) Wins: ${(playerWins / N * 100).toFixed(1)}%`);
console.log(`Bankruptcies: ${(bankruptcies / N * 100).toFixed(1)}%`);
console.log(`Rivals:`);
const rivalNames = ['Ken', 'Cameo', 'Row', 'Lan', 'Dave'];
for (let i = 0; i < 5; i++) {
  console.log(`  ${rivalNames[i]}: ${(rivalWins[i] / N * 100).toFixed(1)}%`);
}
