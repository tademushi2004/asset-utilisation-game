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
  
  // ホイール操作はページスクロールと干渉するため廃止
  // 長押し - 左クリック = 追加、右クリック = 回収
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const isRightClick = e.button === 2;
    const direction = isRightClick ? -1 : 1;
    
    holdStartRef.current = Date.now();
    setIsHolding(true);
    
    // 最初の1枚
    onAllocate(asset.id, direction);
    if (direction > 0) onCoinAdd(); else onCoinRemove();
    
    // 長押しで連続投入
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const rate = elapsed > 1000 ? 5 : 1;
      onAllocate(asset.id, direction * rate);
      if (direction > 0) onCoinAdd(); else onCoinRemove();
    }, 100);
  }, [asset.id, onAllocate, onCoinAdd, onCoinRemove, disabled]);
  
  const handleMouseUp = useCallback(() => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);
  
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
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('mouseleave', handleGlobalUp);
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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      id={`asset-slot-${asset.id}`}
    >
      <div
        className="asset-slot__circle"
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
    </div>
  );
};

export default AssetSlot;
