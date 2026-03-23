'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn-ui';

export function DeleteButton({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-500">แน่ใจหรือไม่?</span>
        <Button
          variant="danger"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          disabled={disabled}
        >
          ยืนยัน
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)}>
          ยกเลิก
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)} disabled={disabled}>
      ลบ
    </Button>
  );
}