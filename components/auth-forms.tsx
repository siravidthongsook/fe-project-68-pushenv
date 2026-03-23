'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from '@/components/shadcn-ui';
import type { Role } from '@/lib/types';

const initialState = {
  name: '',
  telephone: '',
  email: '',
  password: '',
};

export function AuthForm({ mode, nextPath }: { mode: 'login' | 'register'; nextPath?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const title = isRegister ? 'สร้างบัญชีของคุณ' : 'เข้าสู่ระบบ';
  const subtitle = isRegister ? 'กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้' : 'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่บัญชีของคุณ';
  const footerHref = isRegister ? '/login' : '/register';
  const footerLabel = isRegister ? 'เข้าสู่ระบบ' : 'ลงทะเบียน';

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = isRegister
        ? await auth.register({
          name: form.name.trim(),
          telephone: form.telephone.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'user',  // ✅ always user
        })
        : await auth.login(form.email.trim(), form.password);

      const destination = nextPath || (user.role === 'admin' ? '/admin' : '/dashboard');
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถยืนยันตัวตนได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div lang="th" className="w-full max-w-[640px]">
      <Card className="border-zinc-200 bg-white !shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
        <CardHeader className="space-y-2 pt-8 text-center sm:pt-10">
          <CardTitle className="text-xl font-semibold text-zinc-950 sm:text-3xl">
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 sm:text-sm">{subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
          <form className="space-y-4" onSubmit={submit}>
            {error ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 sm:text-sm">
                {isRegister ? 'ไม่สามารถสร้างบัญชีได้' : 'ไม่สามารถเข้าสู่ระบบได้'}
              </div>
            ) : null}

            {isRegister ? (
              <>
                <div className="grid gap-2.5">
                  <Label htmlFor="register-name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="register-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="สมชาย ใจดี"
                    required
                  />
                </div>

                <div className="grid gap-2.5">
                  <Label htmlFor="register-telephone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="register-telephone"
                    value={form.telephone}
                    onChange={(event) => setForm({ ...form, telephone: event.target.value })}
                    placeholder="0812345678"
                    inputMode="numeric"
                    required
                  />
                </div>
              </>
            ) : null}

            <div className="grid gap-2.5">
              <Label htmlFor="auth-email">อีเมล</Label>
              <Input
                id="auth-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="auth-password">รหัสผ่าน</Label>
              <Input
                id="auth-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm text-white hover:bg-zinc-800 sm:py-3.5 sm:text-base"
              disabled={loading}
            >
              {loading ? 'กรุณารอสักครู่...' : isRegister ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-7 sm:pb-8">
          <p className="text-xs text-zinc-500 sm:text-sm">
            {isRegister ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชีใช่ไหม? '}
            <Link href={footerHref} className="font-semibold text-zinc-950 underline underline-offset-4">
              {footerLabel}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
