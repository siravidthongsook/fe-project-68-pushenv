'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn-ui';

export function DeleteButton({
  onConfirm,
  disabled,
  description = 'แน่ใจหรือไม่?',
  triggerText = 'ลบ',
  confirmText = 'ยืนยัน',
}: {
  onConfirm: () => void;
  disabled: boolean;
  description?: string;
  triggerText?: string;
  confirmText?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-500">{description}</span>
        <Button
          variant="danger"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          disabled={disabled}
        >
          {confirmText}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)}>
          ยกเลิก
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)} disabled={disabled}>
      {triggerText}
    </Button>
  );
}
