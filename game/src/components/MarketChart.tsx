import React, { useRef, useEffect } from 'react';
import { type AssetClassId, ASSET_CLASSES } from '../types/game';

interface Props {
  marketHistory: Record<AssetClassId, number[]>;
  turn: number;
}

const MarketChart: React.FC<Props> = ({ marketHistory, turn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Find min/max across all assets
    let minVal = Infinity, maxVal = -Infinity;
    for (const asset of ASSET_CLASSES) {
      const data = marketHistory[asset.id];
      for (const v of data) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    
    // Add margin
    const range = maxVal - minVal || 1;
    minVal -= range * 0.1;
    maxVal += range * 0.1;
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = padding.top + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      
      // Label
      const val = maxVal - ((maxVal - minVal) / gridCount) * i;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padding.left - 4, y + 3);
    }
    
    // Turn labels on x-axis
    const dataLen = Math.max(...ASSET_CLASSES.map(a => marketHistory[a.id].length));
    if (dataLen > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < dataLen; i += Math.max(1, Math.floor(dataLen / 5))) {
        const x = padding.left + (chartW / Math.max(1, dataLen - 1)) * i;
        ctx.fillText(`${i}`, x, h - 4);
      }
    }
    
    // Draw lines for each asset
    for (const asset of ASSET_CLASSES) {
      const data = marketHistory[asset.id];
      if (data.length < 2) continue;
      
      ctx.strokeStyle = asset.color;
      ctx.lineWidth = 2; // 少し太くする
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      
      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (chartW / Math.max(1, data.length - 1)) * i;
        const y = padding.top + chartH - ((data[i] - minVal) / (maxVal - minVal)) * chartH;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Last point dot
      const lastX = padding.left + (chartW / Math.max(1, data.length - 1)) * (data.length - 1);
      const lastY = padding.top + chartH - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
      ctx.globalAlpha = 1;
      ctx.fillStyle = asset.color;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    
    // 100 baseline
    if (100 >= minVal && 100 <= maxVal) {
      const y100 = padding.top + chartH - ((100 - minVal) / (maxVal - minVal)) * chartH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, y100);
      ctx.lineTo(w - padding.right, y100);
      ctx.stroke();
    }
    
  }, [marketHistory, turn]);
  
  return (
    <div className="market-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="market-chart__legend" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '8px',
        justifyContent: 'center',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.7)'
      }}>
        {ASSET_CLASSES.map(asset => (
          <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: asset.color, borderRadius: '2px' }}></span>
            <span>{asset.emoji} {asset.name}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default MarketChart;
