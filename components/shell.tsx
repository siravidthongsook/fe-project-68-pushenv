'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth, useOptionalAuth } from '@/components/auth-provider';
import { Button, AnchorButton, Badge } from '@/components/shadcn-ui';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useEffect } from 'react';

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
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Brand />

        {/* Desktop nav */}
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
                onClick={() => void auth.logout()}
              >
                ออกจากระบบ
              </Button>
            </>
          ) : (
            <>
              <AnchorButton href="/login" variant="secondary">เข้าสู่ระบบ</AnchorButton>
              <AnchorButton href="/register">ลงทะเบียน</AnchorButton>
            </>
          )}

          {/* Burger button — mobile only */}
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

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((link) => (
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
        <TopNav />
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}

function ProtectedNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Desktop nav — unchanged */}
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
              {/* ← Add this */}
              <Button
                type="button"
                variant="outline"
                onClick={() => void logout()}
              >
                ออกจากระบบ
              </Button>
            </div>
          ) : null}

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-ink-600 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer — add logout here too */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 md:hidden">
          {user && (
            <div className="border-b border-zinc-100 py-3">
              <p className="text-sm font-medium text-ink-900">{user.name}</p>
              <p className="text-xs text-ink-500">{user.email}</p>
            </div>
          )}
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((link) => (
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
            {/* ← Add logout at bottom of mobile drawer */}
            {user && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); void logout(); }}
                className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                ออกจากระบบ
              </button>
            )}
          </nav>
        </div>
      )}
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
