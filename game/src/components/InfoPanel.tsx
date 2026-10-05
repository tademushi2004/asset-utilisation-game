import React from 'react';
import { type MarketEvent, type AssetClassId, type EventHistoryEntry } from '../types/game';
import MarketChart from './MarketChart';

interface Props {
  turn: number;
  currentEvent: MarketEvent | null;
  marketHistory: Record<AssetClassId, number[]>;
  eventHistory: EventHistoryEntry[];
}

const InfoPanel: React.FC<Props> = ({ turn, currentEvent, marketHistory, eventHistory }) => {
  return (
    <div className="info-panel">
      <div className="info-panel__section glass-panel info-panel__section--chart" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="info-panel__label">📊 マーケット推移</div>
        <div className="info-panel__chart-container" style={{ flex: 1, minHeight: 0 }}>
           <MarketChart marketHistory={marketHistory} turn={turn} />
        </div>
      </div>
      
      <div className="info-panel__section glass-panel info-panel__section--events">
        <div className="info-panel__label">📢 イベント履歴</div>
        <div className="info-panel__event-list">
          {eventHistory.length > 0 ? (
            eventHistory.slice().reverse().map((entry, idx) => (
              <div key={idx} className={`info-panel__history-item info-panel__history-item--${entry.event.type === 'CRASH' ? 'crash' : entry.event.type === 'INFLATION' ? 'inflation' : entry.event.type === 'LIFE_EVENT' ? 'life-event' : 'boom'}`}>
                <div className="info-panel__history-turn">Turn {entry.turn}</div>
                <div className="info-panel__history-content">
                  <span className="info-panel__history-emoji">{entry.event.emoji}</span>
                  <div className="info-panel__history-text">
                    <div className="info-panel__history-name">{entry.event.name}</div>
                    <div className="info-panel__history-desc">{entry.event.description}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="info-panel__no-event">
              まだイベントは起きていません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
