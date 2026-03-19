'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AnchorButton, Badge, Panel } from '@/components/shadcn-ui';
import { cn } from '@/lib/utils';

export function ProtectedGate({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<'user' | 'admin'>;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Panel className="flex items-center gap-3 px-5 py-4">
          <span className="h-3 w-3 animate-pulse rounded-full bg-zinc-900" />
          <p className="text-sm text-ink-500">กำลังตรวจสอบเซสชันของคุณ...</p>
        </Panel>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6">
        <Panel className="space-y-4 p-8 text-center">
          <Badge className="mx-auto w-fit">จำกัดสิทธิ์</Badge>
          <h1 className="font-display text-3xl text-ink-900">คุณไม่มีสิทธิ์เปิดหน้านี้</h1>
          <p className="text-sm leading-6 text-ink-600">
            เข้าสู่ระบบด้วย <span className="font-medium text-ink-900">{user.email}</span> ในบทบาท{' '}
            <span className="font-medium text-ink-900">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <AnchorButton href="/dashboard">
              ไปยังแดชบอร์ด
            </AnchorButton>
            <AnchorButton href="/" variant="secondary">
              กลับหน้าหลัก
            </AnchorButton>
          </div>
        </Panel>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold',
        role === 'admin' ? 'text-zinc-900' : 'text-zinc-700',
      )}
    >
      {role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}
    </span>
  );
}
