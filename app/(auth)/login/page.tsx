import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-forms';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | ระบบลงทะเบียนงานแฟร์',
  description: 'หน้าเข้าสู่ระบบสำหรับระบบลงทะเบียนงานแฟร์',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <AuthForm mode="login" nextPath={resolvedSearchParams?.next} />;
}
