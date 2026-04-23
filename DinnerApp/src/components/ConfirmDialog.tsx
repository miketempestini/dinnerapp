import { useEffect } from 'react';

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-pop max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cd-title" className="text-lg font-bold text-slate-800">{title}</h2>
        {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={[
              'px-4 py-2 rounded-full text-sm font-semibold text-white shadow-soft',
              danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-orange-500 hover:bg-orange-600',
            ].join(' ')}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
