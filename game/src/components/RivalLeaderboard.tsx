import React, { useMemo } from 'react';
import { type Rival, type EventType, type Allocation, ASSET_CLASSES, totalAllocated, INITIAL_COINS } from '../types/game';
import { getRivalAllocation } from '../logic/rival';

interface Props {
  playerCoins: number;
  playerAllocation: Allocation;
  playerHistory: number[];
  rivals: Rival[];
  lastEvent?: EventType;
}

const AllocationBar: React.FC<{ alloc: Allocation, total: number }> = ({ alloc, total }) => {
  const t = total || 1; // 0除算防止
  return (
    <div style={{ display: 'flex', height: '6px', width: '100%', borderRadius: '3px', overflow: 'hidden', marginTop: '4px', background: 'rgba(255,255,255,0.1)' }}>
      {ASSET_CLASSES.map(a => {
        const amt = alloc[a.id] || 0;
        if (amt <= 0) return null;
        const pct = (amt / t) * 100;
        return <div key={a.id} style={{ width: `${pct}%`, backgroundColor: a.color, height: '100%' }} title={`${a.name}: ${Math.round(pct)}%`} />;
      })}
    </div>
  );
};

const RivalLeaderboard: React.FC<Props> = ({ playerCoins, playerAllocation, playerHistory, rivals, lastEvent = null }) => {
  const getDiff = (history: number[]) => {
    if (history.length === 0) return 0;
    if (history.length === 1) return history[0] - INITIAL_COINS;
    return history[history.length - 1] - history[history.length - 2];
  };

  const entries = useMemo(() => {
    const all = [
      { 
        name: 'あなた', 
        emoji: '🙂', 
        coins: playerCoins, 
        diff: getDiff(playerHistory),
        isPlayer: true,
        alloc: playerAllocation,
        avatarUrl: undefined,
      },
      ...rivals.map(r => ({ 
        name: r.name, 
        emoji: r.emoji, 
        coins: r.coins, 
        diff: getDiff(r.history),
        isPlayer: false,
        alloc: getRivalAllocation(r, lastEvent, null),
        avatarUrl: r.avatarUrl
      })),
    ];
    return all.sort((a, b) => b.coins - a.coins);
  }, [playerCoins, playerAllocation, playerHistory, rivals, lastEvent]);
  
  return (
    <div className="rival-leaderboard glass-panel" id="rival-leaderboard">
      <div className="rival-leaderboard__title">🏆 ランキング</div>
      {entries.map((entry, index) => (
        <div
          key={entry.name}
          className={`rival-entry ${entry.isPlayer ? 'rival-entry--player' : ''} slide-up`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <span className={`rival-entry__rank rival-entry__rank--${index + 1}`}>
            {index + 1}
          </span>
          {entry.avatarUrl ? (
            <img 
              src={entry.avatarUrl} 
              alt={entry.name} 
              className="rival-entry__avatar" 
              style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                padding: entry.name.includes('オウル') ? '5px' : '0',
                backgroundColor: entry.name.includes('オウル') ? '#fff' : 'transparent',
                boxSizing: 'border-box',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }} 
            />
          ) : (
            <span className="rival-entry__emoji" style={{ fontSize: '2rem', width: '44px', textAlign: 'center' }}>{entry.emoji}</span>
          )}
          <div className="rival-entry__info">
            <div className="rival-entry__name">{entry.name}</div>
            <AllocationBar alloc={entry.alloc} total={entry.coins} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '70px' }}>
            <div className="rival-entry__coins">{Math.round(entry.coins)}</div>
            {entry.diff !== 0 && (
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: entry.diff > 0 ? 'var(--accent-green)' : 'var(--accent-red)' 
              }}>
                {entry.diff > 0 ? '+' : ''}{Math.round(entry.diff)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RivalLeaderboard;
