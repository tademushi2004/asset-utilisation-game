import React, { useRef, useEffect } from 'react';

interface RivalData {
  name: string;
  emoji: string;
  history: number[];
}

interface Props {
  playerHistory: number[];
  rivals?: RivalData[];
}

const RIVAL_COLORS = ['#EF5350', '#42A5F5', '#66BB6A', '#AB47BC', '#FFCA28'];

const AssetTrendChart: React.FC<Props> = ({ playerHistory, rivals = [] }) => {
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
    
    // Find min/max across all data
    let minVal = Infinity, maxVal = -Infinity;
    const allHistories = [playerHistory, ...rivals.map(r => r.history)];
    for (const data of allHistories) {
      for (const v of data) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    
    // minValがInfinityの時はデータがないのでデフォルト値
    if (minVal === Infinity) { minVal = 0; maxVal = 100; }
    
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
    
    const dataLen = playerHistory.length;
    // Turn labels on x-axis
    if (dataLen > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < dataLen; i += Math.max(1, Math.floor(dataLen / 5))) {
        const x = padding.left + (chartW / Math.max(1, dataLen - 1)) * i;
        ctx.fillText(`${i}`, x, h - 4);
      }
    }
    
    // Draw lines for rivals
    ctx.lineWidth = 1.5;
    rivals.forEach((rival, index) => {
      const data = rival.history;
      if (data.length < 2) return;
      
      ctx.strokeStyle = RIVAL_COLORS[index % RIVAL_COLORS.length];
      ctx.globalAlpha = 0.6;
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
    });
    ctx.globalAlpha = 1;

    // Draw line for player
    if (playerHistory.length >= 2) {
      ctx.strokeStyle = '#ffd54f'; // var(--accent-gold)
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      for (let i = 0; i < playerHistory.length; i++) {
        const x = padding.left + (chartW / Math.max(1, playerHistory.length - 1)) * i;
        const y = padding.top + chartH - ((playerHistory[i] - minVal) / (maxVal - minVal)) * chartH;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Last point dot
      const lastX = padding.left + (chartW / Math.max(1, playerHistory.length - 1)) * (playerHistory.length - 1);
      const lastY = padding.top + chartH - ((playerHistory[playerHistory.length - 1] - minVal) / (maxVal - minVal)) * chartH;
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner dot
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 100 baseline
    if (100 >= minVal && 100 <= maxVal) {
      const y100 = padding.top + chartH - ((100 - minVal) / (maxVal - minVal)) * chartH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y100);
      ctx.lineTo(w - padding.right, y100);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
  }, [playerHistory, rivals]);
  
  return (
    <div className="glass-panel" style={{ width: '100%', padding: '8px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>📈 総資産推移</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem' }}>
          <span style={{ color: '#ffd54f' }}>● あなた</span>
          {rivals.map((r, i) => (
            <span key={r.name} style={{ color: RIVAL_COLORS[i % RIVAL_COLORS.length], opacity: 0.8 }}>
              ─ {r.emoji}
            </span>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', height: '140px' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default AssetTrendChart;
