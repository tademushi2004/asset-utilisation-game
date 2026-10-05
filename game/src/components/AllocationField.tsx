import React from 'react';
import { ASSET_CLASSES, type AssetClassId, type Allocation } from '../types/game';
import AssetSlot from './AssetSlot';

interface Props {
  allocation: Allocation;
  wallet?: number;
  totalCoins: number;
  onAllocate: (assetId: AssetClassId, amount: number) => void;
  onCoinAdd: () => void;
  onCoinRemove: () => void;
  lastRates?: Record<AssetClassId, number> | null;
  disabled?: boolean;
}

const AllocationField: React.FC<Props> = ({
  allocation, totalCoins, onAllocate, onCoinAdd, onCoinRemove, lastRates, disabled
}) => {
  return (
    <div className="allocation-field">
      <div className="allocation-field__slots">
        {ASSET_CLASSES.map(asset => (
          <AssetSlot
            key={asset.id}
            asset={asset}
            coins={allocation[asset.id]}
            totalPlayerCoins={totalCoins}
            onAllocate={onAllocate}
            onCoinAdd={onCoinAdd}
            onCoinRemove={onCoinRemove}
            lastRate={lastRates?.[asset.id]}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default AllocationField;
