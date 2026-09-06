import React, { useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  confirmClass?: string;
  showNote?: boolean;
  noteLabel?: string;
  onConfirm: (note?: string) => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  confirmClass = 'btn-dash',
  showNote,
  noteLabel = 'Add a note or context...',
  onConfirm,
  onCancel,
}: Props) {
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <div
      className={`confirm-modal-backdrop ${open ? 'open' : ''}`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{body}</p>
        {showNote && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={noteLabel}
            aria-label={noteLabel}
          />
        )}
        <div className="row">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={() => {
              onConfirm(note);
              setNote('');
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
