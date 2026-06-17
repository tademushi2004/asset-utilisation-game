import React, { useEffect, useState } from 'react';
import { type MarketEvent } from '../types/game';

interface Props {
  event: MarketEvent;
  onDismiss: () => void;
}

const EventPopup: React.FC<Props> = ({ event, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div
      className={`event-popup glass-panel`}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        borderColor: event.type === 'CRASH' ? 'rgba(231, 115, 115, 0.4)' :
                     event.type === 'BOOM' ? 'rgba(129, 199, 132, 0.4)' :
                     'rgba(79, 195, 247, 0.4)',
      }}
    >
      <span className="event-popup__emoji">{event.emoji}</span>
      <div
        className="event-popup__name"
        style={{
          color: event.type === 'CRASH' ? 'var(--accent-red)' :
                 event.type === 'BOOM' ? 'var(--accent-green)' :
                 'var(--accent-blue)',
        }}
      >
        {event.name}
      </div>
      <div className="event-popup__desc">{event.description}</div>
    </div>
  );
};

export default EventPopup;
