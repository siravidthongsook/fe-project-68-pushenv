'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth, useOptionalAuth } from '@/components/auth-provider';
import { Button, AnchorButton, Badge } from '@/components/shadcn-ui';
import { cn } from '@/lib/utils';

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-black bg-black text-sm font-semibold text-white shadow-none">
        งฟ
      </span>
      <div>
        <p className="font-display text-lg leading-none text-ink-900">งานแฟร์</p>
        <p className="text-xs text-black">ระบบลงทะเบียน</p>
      </div>
    </Link>
  );
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'แดชบอร์ด' },
  { href: '/admin', label: 'ผู้ดูแล' },
  { href: '/companies', label: 'บริษัท' },
];

function TopNav() {
  const pathname = usePathname();
  const auth = useOptionalAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn('nav-link', isActive(link.href) && 'nav-link-active')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {auth?.user ? (
            <>
              <Badge tone={auth.user.role === 'admin' ? 'warm' : 'accent'}>{auth.user.role}</Badge>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void auth.logout();
                }}
              >
                ออกจากระบบ
              </Button>
            </>
          ) : (
            <>
              <AnchorButton href="/login" variant="secondary">
                เข้าสู่ระบบ
              </AnchorButton>
              <AnchorButton href="/register">ลงทะเบียน</AnchorButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-ink-900">
        <TopNav />
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}

function ProtectedNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white text-ink-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn('nav-link', isActive(link.href) && 'nav-link-active')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-ink-500">{user.email}</p>
              </div>
              <Badge tone={user.role === 'admin' ? 'warm' : 'accent'}>
                {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-ink-900">
        <ProtectedNav />
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
