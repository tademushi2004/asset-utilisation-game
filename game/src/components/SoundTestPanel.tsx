import React, { useState } from 'react';

const SoundTestPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid #fff', borderRadius: '4px', padding: '4px 8px' }}
      >
        サウンドテスト
      </button>
    );
  }
  
  const playDemo = (type: 'add' | 'remove', version: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'add') {
      if (version === 1) {
        // デモ1: マリオ風 (B5 -> E6 の矩形波)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (version === 2) {
        // デモ2: クリーンピン（現在のものに近い、サイン波＋三角波の和音）
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.05);
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);
        osc2.start(ctx.currentTime + 0.05);
        osc2.stop(ctx.currentTime + 0.2);
      } else if (version === 3) {
        // デモ3: レトロアルペジオ (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = ctx.currentTime + i * 0.05;
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        });
      }
    } else {
      if (version === 1) {
        // デモ1: マリオのブロックに弾かれたような音
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (version === 2) {
        // デモ2: クリーンな減少音（現在のものに近い）
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else if (version === 3) {
        // デモ3: レトロアルペジオ下降 (G4 -> E4 -> C4)
        const notes = [392.00, 329.63, 261.63];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = ctx.currentTime + i * 0.05;
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        });
      }
    }
  };
  
  return (
    <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.85)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>🔊 サウンドテスト</h4>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>追加(＋)の音</div>
          <button onClick={() => playDemo('add', 1)} style={{ padding: '6px 12px', background: 'var(--accent-green)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>1. マリオ風</button>
          <button onClick={() => playDemo('add', 2)} style={{ padding: '6px 12px', background: 'var(--accent-blue)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>2. クリーン</button>
          <button onClick={() => playDemo('add', 3)} style={{ padding: '6px 12px', background: 'var(--accent-purple)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>3. レトロ</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>減少(－)の音</div>
          <button onClick={() => playDemo('remove', 1)} style={{ padding: '6px 12px', background: 'var(--accent-red)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>1. ブロック風</button>
          <button onClick={() => playDemo('remove', 2)} style={{ padding: '6px 12px', background: 'var(--accent-orange)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>2. クリーン</button>
          <button onClick={() => playDemo('remove', 3)} style={{ padding: '6px 12px', background: 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }}>3. レトロ</button>
        </div>
      </div>
      
      <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: '#ccc', maxWidth: '200px' }}>
        ※気に入った番号（追加・減少それぞれ）を教えてください。その音をゲーム全体に適用します！
      </p>
    </div>
  );
};

export default SoundTestPanel;
