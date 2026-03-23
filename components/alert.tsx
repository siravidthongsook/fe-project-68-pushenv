import { cn } from '@/lib/utils';

type AlertTone = 'success' | 'error' | 'info';

const styles: Record<AlertTone, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error:   'border-rose-200 bg-rose-50 text-rose-800',
  info:    'border-accent-200 bg-accent-50 text-accent-900',
};

export function Alert({ message, tone }: { message: string; tone: AlertTone }) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-sm', styles[tone])}>
      {message}
    </div>
  );
}