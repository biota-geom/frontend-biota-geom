import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

type SuccessToastProps = {
  message: string;
  onDismiss: () => void;
};

export function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [onDismiss]);

  return (
    <div
      aria-live="polite"
      className="rounded-panel fixed top-5 right-5 z-[70] flex max-w-sm items-center gap-3 border border-emerald-200 bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-card"
      role="status"
    >
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
      >
        <Check size={15} strokeWidth={2.5} />
      </span>
      <span>{message}</span>
      <button
        aria-label="Fechar notificação"
        className="ml-auto grid size-7 shrink-0 place-items-center rounded text-text-muted hover:bg-surface-muted hover:text-text-primary"
        onClick={onDismiss}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}
