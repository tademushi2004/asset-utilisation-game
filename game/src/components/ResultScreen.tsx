import React, { useEffect } from 'react';
import { type PlayerState, type Rival } from '../types/game';
import { getDreamLife, getPlayStyleTitle, getFinalRankings } from '../logic/scoring';

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
  
  return (
    <div className="result-screen">
      <div className="result-screen__dreamlife slide-up">
        <span className="result-screen__dreamlife-emoji">{dreamLife.emoji}</span>
        <div className="result-screen__dreamlife-title">{dreamLife.title}</div>
        <div className="result-screen__dreamlife-desc">{dreamLife.description}</div>
      </div>
      
      <div className="slide-up" style={{ animationDelay: '0.2s', textAlign: 'center' }}>
        <div className="result-screen__coins-label">最終資産</div>
        <div className="result-screen__coins glow-text">{player.coins.toFixed(1)} コイン</div>
        <div className="result-screen__coins-label" style={{ marginTop: '4px' }}>
          (初期: 100 コイン → {player.coins >= 100 ? '+' : ''}{(player.coins - 100).toFixed(1)} コイン)
        </div>
      </div>
      
      <div className="result-screen__playstyle glass-panel slide-up" style={{ animationDelay: '0.4s' }}>
        <div className={`result-screen__playstyle-rank result-screen__playstyle-rank--${playStyle.rank}`}>
          ランク {playStyle.rank}
        </div>
        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{playStyle.emoji}</div>
        <div className="result-screen__playstyle-title">{playStyle.title}</div>
        <div className="result-screen__playstyle-subtitle">{playStyle.subtitle}</div>
      </div>
      
      <div className="result-screen__rankings slide-up" style={{ animationDelay: '0.6s' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          🏆 最終順位
        </div>
        {rankings.map((entry, index) => (
          <div
            key={entry.name}
            className={`result-screen__ranking-entry ${entry.isPlayer ? 'result-screen__ranking-entry--player' : ''} glass-panel`}
          >
            <span className={`rival-entry__rank rival-entry__rank--${index + 1}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, width: '24px' }}>
              {index + 1}
            </span>
            <span style={{ fontSize: '1.2rem' }}>{entry.emoji}</span>
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{entry.name}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-gold)' }}>
              {entry.coins.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      
      <button className="btn-restart slide-up" style={{ animationDelay: '0.8s' }} onClick={onRestart} id="btn-restart">
        🔄 もう一度遊ぶ
      </button>
    </div>
  );
};

export default ResultScreen;
