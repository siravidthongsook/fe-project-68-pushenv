'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const TOAST_DURATION_MS = 4000;

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
  error: 'border-rose-200 bg-rose-50/95 text-rose-900',
  info: 'border-zinc-200 bg-white/95 text-zinc-900',
};

const toneLabels: Record<ToastTone, string> = {
  success: 'สำเร็จ',
  error: 'เกิดข้อผิดพลาด',
  info: 'ข้อมูล',
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutRef = useRef<Map<number, ReturnType<typeof globalThis.setTimeout>>>(new Map());
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeoutId = timeoutRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutRef.current.delete(id);
    }
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const id = nextIdRef.current++;
    setToasts((current) => [...current, { id, message: trimmedMessage, tone }]);

    const timeoutId = globalThis.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timeoutRef.current.delete(id);
    }, TOAST_DURATION_MS);

    timeoutRef.current.set(id, timeoutId);
  }, []);

  useEffect(() => {
    const activeTimeouts = timeoutRef.current;
    return () => {
      activeTimeouts.forEach((timeoutId) => globalThis.clearTimeout(timeoutId));
      activeTimeouts.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
      info: (message: string) => show(message, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur toast-enter',
              toneStyles[toast.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold opacity-70">
                  {toneLabels[toast.tone]}
                </p>
                <p className="mt-1 text-sm leading-6">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
                aria-label="ปิดข้อความแจ้งเตือน"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast ต้องใช้ภายใน ToastProvider');
  }
  return value;
}
