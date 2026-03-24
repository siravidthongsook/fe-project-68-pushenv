import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-forms';

export const metadata: Metadata = {
  title: 'ลงทะเบียน | ระบบลงทะเบียนงาน Job Fair',
  description: 'หน้าลงทะเบียนสำหรับระบบลงทะเบียนงาน Job Fair',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <AuthForm mode="register" nextPath={resolvedSearchParams?.next} />;
}
