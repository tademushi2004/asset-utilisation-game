import { useCallback } from 'react';

/**
 * 触覚フィードバック (navigator.vibrate API)
 * モバイル端末向け。非対応端末では何もしない。
 */
export function useHaptics() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  
  /** コイン移動時の微弱な振動 */
  const vibrateCoin = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate(10);
    }
  }, [canVibrate]);
  
  /** 大暴落時の強い振動パターン */
  const vibrateCrash = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [canVibrate]);
  
  /** 好景気時の心地よい振動 */
  const vibrateBoom = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate([30, 30, 30, 30, 60]);
    }
  }, [canVibrate]);
  
  /** 決定ボタン押下時 */
  const vibrateConfirm = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate(30);
    }
  }, [canVibrate]);
  
  return { vibrateCoin, vibrateCrash, vibrateBoom, vibrateConfirm };
}
