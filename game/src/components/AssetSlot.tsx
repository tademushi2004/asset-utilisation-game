import React, { useCallback, useRef, useState, useEffect } from 'react';
import { type AssetClassId, type AssetClassDef } from '../types/game';

interface Props {
  asset: AssetClassDef;
  coins: number;
  totalPlayerCoins: number;
  onAllocate: (assetId: AssetClassId, amount: number) => void;
  onCoinAdd: () => void;    // 追加時のサウンド
  onCoinRemove: () => void; // 回収時のサウンド
  lastRate?: number;
  disabled?: boolean;
}

const AssetSlot: React.FC<Props> = ({ asset, coins, totalPlayerCoins, onAllocate, onCoinAdd, onCoinRemove, lastRate, disabled }) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const touchDirectionRef = useRef<number>(1);
  
  // === 共通: 長押し開始 ===
  const startHold = useCallback((direction: number) => {
    if (disabled) return;
    
    // もし既にタイマーが走っていたら確実に止める（無限ループ・二重起動の防止）
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    
    holdStartRef.current = Date.now();
    touchDirectionRef.current = direction;
    setIsHolding(true);
    
    // 最初の1枚
    onAllocate(asset.id, direction);
    if (direction > 0) onCoinAdd(); else onCoinRemove();
    
    // 長押しで連続投入
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const rate = elapsed > 1000 ? 5 : 1;
      onAllocate(asset.id, touchDirectionRef.current * rate);
      if (touchDirectionRef.current > 0) onCoinAdd(); else onCoinRemove();
    }, 100);
  }, [asset.id, onAllocate, onCoinAdd, onCoinRemove, disabled]);

  // === 共通: 長押し解除 ===
  const stopHold = useCallback(() => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  // === マウス操作 (PC向け) ===
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const isRightClick = e.button === 2;
    startHold(isRightClick ? -1 : 1);
  }, [disabled, startHold]);
  
  const handleMouseUp = useCallback(() => {
    stopHold();
  }, [stopHold]);
  
  // === タッチ操作 (モバイル向け: ＋/−ボタン用) ===
  const handleTouchAdd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    startHold(1);
  }, [disabled, startHold]);

  const handleTouchRemove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    startHold(-1);
  }, [disabled, startHold]);

  const handleTouchEndButton = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopHold();
  }, [stopHold]);
  
  // クリーンアップ
  useEffect(() => {
    const handleGlobalUp = () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setIsHolding(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('mouseleave', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('mouseleave', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);
  
  // 右クリックメニュー抑制
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);
  
  // 塗りの高さ計算
  const fillPercent = totalPlayerCoins > 0 ? Math.min(100, (coins / totalPlayerCoins) * 100) : 0;
  
  return (
    <div
      className={`asset-slot ${isHolding ? 'asset-slot--active' : ''}`}
      onContextMenu={handleContextMenu}
      id={`asset-slot-${asset.id}`}
    >
      {/* PC向け: 円全体がクリック/長押しのターゲット */}
      <div
        className="asset-slot__circle"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          '--slot-color': asset.color,
          '--fill-percent': `${fillPercent}%`,
          borderColor: coins > 0 ? asset.color : undefined,
          boxShadow: coins > 0 ? `0 0 15px ${asset.color}33` : undefined,
        } as React.CSSProperties}
      >
        <span className="asset-slot__emoji">{asset.emoji}</span>
        <span className="asset-slot__coins">{Math.round(coins)}</span>
      </div>
      <span className="asset-slot__name" style={{ color: asset.color }}>{asset.name}</span>
      {lastRate !== undefined && (
        <span className={`asset-slot__rate ${lastRate >= 0 ? 'asset-slot__rate--positive' : 'asset-slot__rate--negative'}`}>
          {lastRate >= 0 ? '+' : ''}{(lastRate * 100).toFixed(1)}%
        </span>
      )}
      {/* モバイル向け: 明示的な ＋/− ボタン */}
      {!disabled && (
        <div className="asset-slot__mobile-buttons">
          <button
            className="asset-slot__btn asset-slot__btn--minus"
            onTouchStart={handleTouchRemove}
            onTouchEnd={handleTouchEndButton}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startHold(-1); }}
            onMouseUp={(e) => { e.stopPropagation(); stopHold(); }}
            aria-label={`${asset.name}から回収`}
            style={{ '--slot-color': asset.color } as React.CSSProperties}
          >
            −
          </button>
          <button
            className="asset-slot__btn asset-slot__btn--plus"
            onTouchStart={handleTouchAdd}
            onTouchEnd={handleTouchEndButton}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startHold(1); }}
            onMouseUp={(e) => { e.stopPropagation(); stopHold(); }}
            aria-label={`${asset.name}に追加`}
            style={{ '--slot-color': asset.color } as React.CSSProperties}
          >
            ＋
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetSlot;
