import React from 'react';
import { totalAllocated, type Allocation } from '../types/game';

interface Props {
  wallet: number;
  totalCoins: number;
  allocation: Allocation;
  onEndTurn: () => void;
  onRepeatAllocation?: () => void;
  turn?: number;
  disabled?: boolean;
}

const PlayerWallet: React.FC<Props> = ({ wallet, totalCoins, allocation, onEndTurn, onRepeatAllocation, turn = 1, disabled }) => {
  const allocated = totalAllocated(allocation);
  const allAllocated = wallet <= 0.01; // 小数点誤差を考慮
  const canEndTurn = allocated > 0 && allAllocated && !disabled;
  
  return (
    <div className="player-wallet glass-panel" id="player-wallet">
      <div className="player-wallet__info">
        <span className="player-wallet__icon">👛</span>
        <div>
          <div className="player-wallet__label">未配分コイン</div>
          <div className="player-wallet__amount">{Math.round(wallet)}</div>
          <div className="player-wallet__total">
            総資産: {totalCoins.toFixed(1)} コイン
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <button
          className="btn-end-turn"
          onClick={onEndTurn}
          disabled={!canEndTurn}
          id="btn-end-turn"
          style={{ width: '100%', padding: '12px 24px', fontSize: '1.05rem' }}
        >
          {!allAllocated ? `残り ${Math.round(wallet)} コインを割り振ってください` : '✨ 決定（ターン終了）'}
        </button>
        
        {turn > 1 && onRepeatAllocation && (
          <button
            onClick={onRepeatAllocation}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!disabled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              if (!disabled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ↺ 前回と同じ比率で配分する
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerWallet;
