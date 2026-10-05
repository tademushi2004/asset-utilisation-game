import { useCallback, useRef } from 'react';

/**
 * 触覚フィードバック
 * 
 * 1. navigator.vibrate API (Android Chrome 等)
 * 2. 非対応端末（iOS Safari 等）では何もしない
 * 
 * ※ iOS Safari は Vibration API を一切サポートしていないため、
 *   iPhoneでは振動しません。これはブラウザ側の制約です。
 *   代わりにサウンドフィードバック（useSound）が機能します。
 */
export function useHaptics() {
  // ユーザー操作後に一度でも vibrate を呼べたかどうかを記録
  const hasVibratedRef = useRef(false);

  const tryVibrate = useCallback((pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        const result = navigator.vibrate(pattern);
        if (result) hasVibratedRef.current = true;
      }
    } catch {
      // vibrate が例外を投げる場合もあるので安全に無視
    }
  }, []);
  
  /** コイン移動時の微弱な振動 */
  const vibrateCoin = useCallback(() => {
    tryVibrate(15);
  }, [tryVibrate]);
  
  /** 大暴落時の強い振動パターン */
  const vibrateCrash = useCallback(() => {
    tryVibrate([100, 50, 100, 50, 200]);
  }, [tryVibrate]);
  
  /** 好景気時の心地よい振動 */
  const vibrateBoom = useCallback(() => {
    tryVibrate([30, 30, 30, 30, 60]);
  }, [tryVibrate]);
  
  /** 決定ボタン押下時 */
  const vibrateConfirm = useCallback(() => {
    tryVibrate(30);
  }, [tryVibrate]);
  
  return { vibrateCoin, vibrateCrash, vibrateBoom, vibrateConfirm };
}
