import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-forms';

export const metadata: Metadata = {
  title: 'ลงทะเบียน | ระบบลงทะเบียนงานแฟร์',
  description: 'หน้าลงทะเบียนสำหรับระบบลงทะเบียนงานแฟร์',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <AuthForm mode="register" nextPath={resolvedSearchParams?.next} />;
}
