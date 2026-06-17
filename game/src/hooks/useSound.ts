import { useCallback, useRef } from 'react';

// Web Audio API でプログラム的にサウンドを生成する
// 外部の音声ファイルに依存しない

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * コイン追加の「チャリン」音 - 上昇する明るい音
 */
function playCoinAddSound(combo: number) {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99]; // レトロアルペジオ: C5 -> E5 -> G5
  const pitchShift = 1 + (combo * 0.02); // 連続クリックで少しずつピッチ上昇
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.05;
    
    osc.type = 'triangle';
    osc.frequency.value = freq * pitchShift;
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

/**
 * コイン回収の「ポコン」音 - 下降する柔らかい音
 * comboで音程が下がる
 */
function playCoinRemoveSound(combo: number) {
  const ctx = getAudioContext();
  const notes = [392.00, 329.63, 261.63]; // レトロアルペジオ下降: G4 -> E4 -> C4
  const pitchShift = 1 + (combo * 0.02); // ご要望通り、連続で少しずつピッチ高くなる
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.05;
    
    osc.type = 'triangle';
    osc.frequency.value = freq * pitchShift;
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

function playCollectionIncrease(diff: number) {
  const ctx = getAudioContext();
  const count = Math.min(Math.floor(diff / 5) + 1, 15); 
  const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
  
  for (let c = 0; c < count; c++) {
    const baseT = ctx.currentTime + c * 0.1; // アルペジオを連続で鳴らす
    const isLastCombo = (c === count - 1);
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = baseT + i * 0.05;
      
      osc.type = 'triangle';
      osc.frequency.value = freq; // ピッチは一定に保つ（ご要望通り）
      
      // 最後のアルペジオの最後の音だけ、流していた時間に応じて余韻を残す
      const isLastNote = isLastCombo && (i === notes.length - 1);
      const tailLength = isLastNote ? 0.4 + (count * 0.05) : 0.15;
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + tailLength);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + tailLength);
    });
  }
}

function playCollectionDecrease(diff: number) {
  const ctx = getAudioContext();
  const absDiff = Math.abs(diff);
  const count = Math.min(Math.floor(absDiff / 5) + 1, 10);
  const notes = [392.00, 329.63, 261.63]; // G4 -> E4 -> C4
  
  for (let c = 0; c < count; c++) {
    const baseT = ctx.currentTime + c * 0.15;
    const isLastCombo = (c === count - 1);
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = baseT + i * 0.05;
      
      osc.type = 'triangle';
      osc.frequency.value = freq; // ピッチは一定に保つ
      
      const isLastNote = isLastCombo && (i === notes.length - 1);
      const tailLength = isLastNote ? 0.3 + (count * 0.05) : 0.15;
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + tailLength);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + tailLength);
    });
  }
}

function playCollectionNeutral() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * 大暴落時の不穏な音
 */
function playCrashSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
  osc.type = 'sawtooth';
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

/**
 * 好景気のファンファーレ
 */
function playBoomSound() {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const t = ctx.currentTime + i * 0.12;
    osc.frequency.value = freq;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/**
 * 決定ボタン押下時の音
 */
function playConfirmSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
  osc.type = 'sine';
  
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * リザルト画面のドラムロール
 */
function playResultSound() {
  const ctx = getAudioContext();
  for (let i = 0; i < 20; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const t = ctx.currentTime + i * 0.05;
    osc.frequency.value = 200 + i * 40;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.05 + i * 0.005, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}

/**
 * ライフイベント発生時の警告音
 */
function playLifeEventSound() {
  const ctx = getAudioContext();
  const notes = [440, 349.23, 293.66]; // A4, F4, D4 下降音
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const t = ctx.currentTime + i * 0.15;
    osc.frequency.value = freq;
    osc.type = 'square';
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

export function useSound() {
  const addComboRef = useRef(0);
  const removeComboRef = useRef(0);
  const lastAddRef = useRef(0);
  const lastRemoveRef = useRef(0);
  
  /** コイン追加時の上昇する音 */
  const playCoinAdd = useCallback(() => {
    const now = Date.now();
    if (now - lastAddRef.current < 300) {
      addComboRef.current++;
    } else {
      addComboRef.current = 0;
    }
    lastAddRef.current = now;
    playCoinAddSound(addComboRef.current);
  }, []);
  
  /** コイン回収時の下降する音 */
  const playCoinRemove = useCallback(() => {
    const now = Date.now();
    if (now - lastRemoveRef.current < 300) {
      removeComboRef.current++;
    } else {
      removeComboRef.current = 0;
    }
    lastRemoveRef.current = now;
    playCoinRemoveSound(removeComboRef.current);
  }, []);
  
  const playCollection = useCallback((diff: number) => {
    if (diff > 0) playCollectionIncrease(diff);
    else if (diff < 0) playCollectionDecrease(diff);
    else playCollectionNeutral();
  }, []);
  
  const playCrash = useCallback(() => {
    playCrashSound();
  }, []);
  
  const playBoom = useCallback(() => {
    playBoomSound();
  }, []);
  
  const playConfirm = useCallback(() => {
    playConfirmSound();
  }, []);
  
  const playResult = useCallback(() => {
    playResultSound();
  }, []);
  
  const playLifeEvent = useCallback(() => {
    playLifeEventSound();
  }, []);
  
  return { playCoinAdd, playCoinRemove, playCollection, playCrash, playBoom, playConfirm, playResult, playLifeEvent };
}
