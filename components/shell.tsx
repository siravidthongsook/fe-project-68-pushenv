'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useOptionalAuth } from '@/components/auth-provider';
import { Button, AnchorButton, Badge } from '@/components/shadcn-ui';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-black bg-black text-sm font-semibold text-white shadow-none">
        J
      </span>
      <div>
        <p className="font-display text-lg leading-none text-ink-900">Job Fair</p>
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

function getRoleLabel(role: 'user' | 'admin') {
  return role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้';
}

function AppNav({ allowGuestActions }: { allowGuestActions: boolean }) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = auth?.status === 'authenticated' ? auth.user : null;
  const visibleLinks = NAV_LINKS.filter((link) => link.href !== '/admin' || currentUser?.role === 'admin');
  const isAuthenticated = !!currentUser;
  const showGuestActions = allowGuestActions && auth?.status === 'anonymous';
  const handleLogout = () => {
    if (!auth) {
      return;
    }
    void auth.logout();
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const header = document.querySelector('header');
      if (header && !header.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white text-ink-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-2 md:flex">
          {visibleLinks.map((link) => (
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
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-ink-500">{currentUser.email}</p>
              </div>
              <Badge tone={currentUser.role === 'admin' ? 'warm' : 'accent'}>
                {getRoleLabel(currentUser.role)}
              </Badge>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
              >
                ออกจากระบบ
              </Button>
            </div>
          ) : showGuestActions ? (
            <>
              <AnchorButton href="/login" variant="secondary">เข้าสู่ระบบ</AnchorButton>
              <AnchorButton href="/register">ลงทะเบียน</AnchorButton>
            </>
          ) : null}

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-ink-600 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          >
            {menuOpen ? (
              // X icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            ) : (
              // Hamburger icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 md:hidden">
          {isAuthenticated ? (
            <div className="border-b border-zinc-100 py-3">
              <p className="text-sm font-medium text-ink-900">{currentUser.name}</p>
              <p className="text-xs text-ink-500">{currentUser.email}</p>
            </div>
          ) : null}
          <nav className="flex flex-col gap-1 pt-3">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-zinc-50 hover:text-ink-900',
                  isActive(link.href) && 'bg-zinc-100 text-ink-900',
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                ออกจากระบบ
              </button>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-ink-900">
        <AppNav allowGuestActions />
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-ink-900">
        <AppNav allowGuestActions={false} />
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
