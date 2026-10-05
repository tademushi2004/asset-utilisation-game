import React, { useEffect } from 'react';
import { type PlayerState, type Rival } from '../types/game';
import { getDreamLife, getPlayStyleTitle, getFinalRankings } from '../logic/scoring';
import AssetTrendChart from './AssetTrendChart';

interface Props {
  player: PlayerState;
  rivals: Rival[];
  onRestart: () => void;
  onPlayResultSound: () => void;
}

const ResultScreen: React.FC<Props> = ({ player, rivals, onRestart, onPlayResultSound }) => {
  const dreamLife = getDreamLife(player.coins);
  const playStyle = getPlayStyleTitle(player);
  const rankings = getFinalRankings(player.coins, rivals);
  
  useEffect(() => {
    onPlayResultSound();
  }, [onPlayResultSound]);
  
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return { icon: '🥇', fontSize: '1.5rem', scale: 1.1 };
      case 1: return { icon: '🥈', fontSize: '1.3rem', scale: 1.05 };
      case 2: return { icon: '🥉', fontSize: '1.2rem', scale: 1.0 };
      default: return { icon: `${index + 1}`, fontSize: '1.1rem', scale: 0.95 };
    }
  };

  return (
    <div className="result-screen">
      <div className="slide-up" style={{ textAlign: 'center', marginBottom: 'var(--sp-md)' }}>
        <div className="result-screen__coins-label" style={{ fontSize: '1.2rem', fontWeight: 700 }}>最終資産</div>
        <div className="result-screen__coins glow-text" style={{ fontSize: '3rem', margin: '8px 0' }}>{player.coins.toFixed(1)} コイン</div>
        <div className="result-screen__coins-label" style={{ fontSize: '1.1rem', marginTop: '4px', whiteSpace: 'nowrap', color: 'var(--accent-gold)' }}>
          (初期: 100 コイン → {player.coins >= 100 ? '+' : ''}{(player.coins - 100).toFixed(1)} コイン)
        </div>
      </div>

      <div className="result-screen__cards-container slide-up" style={{ display: 'flex', gap: 'var(--sp-md)', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '700px' }}>
        
        <div className="result-screen__dreamlife glass-panel" style={{ flex: '1', minWidth: '280px', padding: 'var(--sp-md)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>
            👑 最終資産ランク
          </div>
          <span className="result-screen__dreamlife-emoji" style={{ fontSize: '3rem', marginBottom: '8px' }}>{dreamLife.emoji}</span>
          <div className="result-screen__dreamlife-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{dreamLife.title}</div>
          <div className="result-screen__dreamlife-desc" style={{ fontSize: '0.85rem' }}>{dreamLife.description}</div>
        </div>

        <div className="result-screen__playstyle glass-panel" style={{ flex: '1', minWidth: '280px', padding: 'var(--sp-md)', animationDelay: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>
            🏷️ プレイスタイル称号
          </div>
          <div className={`result-screen__playstyle-rank result-screen__playstyle-rank--${playStyle.rank}`}>
            ランク {playStyle.rank}
          </div>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{playStyle.emoji}</div>
          <div className="result-screen__playstyle-title" style={{ fontSize: '1.2rem' }}>{playStyle.title}</div>
          <div className="result-screen__playstyle-subtitle" style={{ fontSize: '0.85rem' }}>{playStyle.subtitle}</div>
        </div>

      </div>
      
      <div className="result-screen__rankings slide-up" style={{ animationDelay: '0.4s', marginTop: 'var(--sp-md)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '1rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', textAlign: 'center', fontWeight: 800 }}>
          🏆 最終順位
        </div>
        {rankings.map((entry, index) => {
          const rStyle = getRankStyle(index);
          // 1位: 100%, 2位: 92%, 3位: 84% ... のように横幅を狭くする
          const rowWidth = `${100 - index * 8}%`;
          
          return (
            <div
              key={entry.name}
              className={`result-screen__ranking-entry ${entry.isPlayer ? 'result-screen__ranking-entry--player' : ''} glass-panel`}
              style={{ 
                width: rowWidth, 
                maxWidth: '400px', 
                minWidth: '280px',
                transform: `scale(${rStyle.scale})`, 
                transformOrigin: 'center', 
                margin: '6px 0', 
                transition: 'all 0.3s ease' 
              }}
            >
              <span className={`rival-entry__rank rival-entry__rank--${index + 1}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, width: '36px', fontSize: rStyle.fontSize, textAlign: 'center' }}>
                {rStyle.icon}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{entry.emoji}</span>
              <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{entry.name}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {entry.coins.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="slide-up" style={{ animationDelay: '0.6s', width: '100%', maxWidth: '700px', margin: 'var(--sp-md) auto' }}>
        <AssetTrendChart
          playerHistory={player.history}
          rivals={rivals.map(r => ({ name: r.name, emoji: r.emoji, history: r.history }))}
        />
      </div>
      
      <button className="btn-restart slide-up" style={{ animationDelay: '0.8s' }} onClick={onRestart} id="btn-restart">
        🔄 もう一度遊ぶ
      </button>
    </div>
  );
};

export default ResultScreen;
