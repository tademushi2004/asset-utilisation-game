import React, { useEffect, useState } from 'react';
import { type LifeEvent } from '../types/game';

interface Props {
  event: LifeEvent;
  penalty: number;
  onDismiss: () => void;
}

const LifeEventPopup: React.FC<Props> = ({ event, penalty, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000); // ライフイベントは少し長めに表示
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const isBankruptcy = penalty === -1 || penalty > 15; // penaltyが非常に大きい場合は破産級ダメージ
  
  return (
    <div
      className={`event-popup glass-panel`}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        borderColor: isBankruptcy ? 'rgba(231, 115, 115, 0.8)' : 'rgba(255, 183, 77, 0.6)',
        boxShadow: isBankruptcy ? '0 0 40px rgba(231, 115, 115, 0.4)' : '0 0 20px rgba(255, 183, 77, 0.2)',
        zIndex: 100, // 通常のイベントポップアップより前面へ
        transform: 'translate(-50%, -50%) scale(1.1)', // 少し大きく
      }}
    >
      <span className="event-popup__emoji" style={{ fontSize: '4rem' }}>{event.emoji}</span>
      <div
        className="event-popup__name"
        style={{
          color: isBankruptcy ? 'var(--accent-red)' : 'var(--accent-orange)',
          fontSize: '1.5rem',
        }}
      >
        ⚠️ 突然の出費: {event.name}
      </div>
      <div className="event-popup__desc" style={{ fontSize: '1rem', marginTop: '8px' }}>
        {event.description}
      </div>
      <div style={{
        marginTop: '16px',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        color: isBankruptcy ? 'var(--accent-red)' : 'var(--accent-gold)',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        {isBankruptcy ? '預金不足！ 多大なペナルティを受けました…' : `預金から ${penalty} コイン 支払いました`}
      </div>
    </div>
  );
};

export default LifeEventPopup;
