import React from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<Props> = ({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel} id="confirm-modal">
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn-modal-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn-modal-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
