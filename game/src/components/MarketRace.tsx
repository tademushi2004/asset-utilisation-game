import React, { useState, useEffect, useRef } from 'react';
import { ASSET_CLASSES, type AssetClassId } from '../types/game';

interface Props {
  rates: Record<AssetClassId, number>;
  onRaceDone: () => void;
}

const MarketRace: React.FC<Props> = ({ rates, onRaceDone }) => {
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Start animation after a short delay
    const startTimer = setTimeout(() => {
      setProgress(100);
    }, 300);
    
    // Show rate numbers after bars animate
    const resultTimer = setTimeout(() => {
      setShowResults(true);
    }, 2500);
    
    // Auto-advance after showing results
    timerRef.current = window.setTimeout(() => {
      onRaceDone();
    }, 4500);
    
    return () => {
      clearTimeout(startTimer);
      clearTimeout(resultTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onRaceDone]);
  
  // Sort assets by rate for visual ranking
  const sortedAssets = [...ASSET_CLASSES].sort((a, b) => rates[b.id] - rates[a.id]);
  
  // Normalize rates for bar width (map to 10%-90% range)
  const rateValues = Object.values(rates);
  const minRate = Math.min(...rateValues);
  const maxRate = Math.max(...rateValues);
  const rateRange = maxRate - minRate || 0.01;
  
  return (
    <div className="market-race">
      <div className="market-race__title">📈 市場変動レース！</div>
      <div className="market-race__bars">
        {sortedAssets.map((asset, index) => {
          const rate = rates[asset.id];
          const normalizedWidth = 15 + ((rate - minRate) / rateRange) * 75;
          const isPositive = rate >= 0;
          
          return (
            <div key={asset.id} className="race-bar" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="race-bar__label">
                <span>{asset.emoji}</span>
                <span style={{ fontSize: '0.75rem' }}>{asset.name}</span>
              </div>
              <div className="race-bar__track">
                {/* 100% (rate=0) の基準線 */}
                <div style={{
                  position: 'absolute',
                  left: `${15 + ((0 - minRate) / rateRange) * 75}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  zIndex: 1
                }} />
                <div
                  className="race-bar__fill"
                  style={{
                    width: progress === 100 ? `${normalizedWidth}%` : '5%',
                    background: `linear-gradient(90deg, ${asset.color}88, ${asset.color})`,
                  }}
                />
              </div>
              <div
                className="race-bar__rate"
                style={{
                  color: isPositive ? '#81c784' : '#e57373',
                  opacity: showResults ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {isPositive ? '+' : ''}{(rate * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      
      {showResults && (
        <button
          className="btn-end-turn"
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onRaceDone();
          }}
          style={{ marginTop: '16px' }}
        >
          次へ進む →
        </button>
      )}
    </div>
  );
};

export default MarketRace;
