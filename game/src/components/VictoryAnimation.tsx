import React, { useEffect, useState } from 'react';
import { getFinalRankings } from '../logic/scoring';
import { type PlayerState, type Rival } from '../types/game';

interface Props {
  player: PlayerState;
  rivals: Rival[];
  onComplete: () => void;
}

const VictoryAnimation: React.FC<Props> = ({ player, rivals, onComplete }) => {
  const [stage, setStage] = useState<'box' | 'pop'>('box');

  useEffect(() => {
    // 1秒後に箱が開く
    const timer1 = setTimeout(() => {
      setStage('pop');
      // 箱が開いてから2.5秒後に次へ
      const timer2 = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer2);
    }, 1000);
    return () => clearTimeout(timer1);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', zIndex: 1000,
    }}>
      <div style={{
        fontSize: '8rem',
        animation: stage === 'box' ? 'shake 0.5s infinite' : 'popOut 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        transformOrigin: 'bottom center',
        filter: 'drop-shadow(0 0 30px rgba(255, 213, 79, 0.5))'
      }}>
        {stage === 'box' ? '🎁' : '🎉'}
      </div>
      
      {stage === 'pop' && (
        <div style={{
          marginTop: '2rem',
          animation: 'slideUp 0.5s ease-out forwards',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '3rem', 
            color: 'var(--accent-gold)',
            textShadow: '0 0 20px rgba(255, 213, 79, 0.5)'
          }}>
            優勝！
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            見事1位に輝きました！
          </p>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg) scale(1.05); }
          50% { transform: rotate(0eg) scale(1.05); }
          75% { transform: rotate(-5deg) scale(1.05); }
          100% { transform: rotate(0deg); }
        }
        @keyframes popOut {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VictoryAnimation;
