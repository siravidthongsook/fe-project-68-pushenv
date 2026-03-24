'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { AnchorButton, Badge, Button, EmptyState, Field, Panel, Select, Spinner, StatCard } from '@/components/shadcn-ui';
import { Alert } from '@/components/alert';
import { createInterview, getCompanies, getInterviews, getUsers } from '@/lib/api';
import { interviewOptions } from '@/lib/date';
import type { Company, Interview, User } from '@/lib/types';
import { useAsync } from '@/hooks/use-async';

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_INTERVIEWS: Interview[] = [];
const EMPTY_USERS: User[] = [];

function formatUserOption(user: User) {
  const roleLabel = user.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้';
  return `${user.name || user.email} • ${user.email} • ${roleLabel}`;
}

function formatCompanyOption(company: Company) {
  return `${company.name} • ${company.address}`;
}

export function AdminPage() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [bookingUserId, setBookingUserId] = useState('');
  const [bookingCompanyId, setBookingCompanyId] = useState('');
  const [bookingDate, setBookingDate] = useState<string>(interviewOptions[0].value);

  const { data, loading, error, reload } = useAsync(async () => {
    if (!token) return null;

    const [companies, interviews, users] = await Promise.all([
      getCompanies(token),
      getInterviews(token),
      getUsers(token),
    ]);

    return { companies, interviews, users };
  }, [token]);

  const companies = data?.companies ?? EMPTY_COMPANIES;
  const interviews = data?.interviews ?? EMPTY_INTERVIEWS;
  const users = data?.users ?? EMPTY_USERS;

  useEffect(() => {
    if (users.length === 0) {
      if (bookingUserId) {
        setBookingUserId('');
      }
      return;
    }

    if (!users.some((user) => user.id === bookingUserId)) {
      setBookingUserId(users[0].id);
    }
  }, [bookingUserId, users]);

  useEffect(() => {
    if (companies.length === 0) {
      if (bookingCompanyId) {
        setBookingCompanyId('');
      }
      return;
    }

    if (!companies.some((company) => company.id === bookingCompanyId)) {
      setBookingCompanyId(companies[0].id);
    }
  }, [bookingCompanyId, companies]);

  const companyStats = companies.length.toString();
  const interviewStats = interviews.length.toString();
  const userStats = users.length.toString();
  const bookingReady = users.length > 0 && companies.length > 0;

  const createBooking = async () => {
    if (!token || !bookingUserId || !bookingCompanyId) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await createInterview(token, bookingCompanyId, bookingDate, bookingUserId);
      setMessage({ text: 'สร้างการจองให้ผู้ใช้แล้ว', tone: 'success' });
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'ไม่สามารถสร้างการจองได้', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <Spinner label="กำลังโหลดหน้าสร้างการจอง..." />
        </Panel>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <p className="eyebrow">แดชบอร์ดแอดมิน</p>
            <h1 className="font-display text-4xl">สร้างการจองแทนผู้ใช้</h1>
            <p className="max-w-3xl text-sm leading-6 text-ink-600">
              ใช้หน้านี้สำหรับสร้างการจองให้ผู้ใช้คนใดก็ได้ ส่วนการแก้ไขและลบอยู่ที่หน้าจัดการ
            </p>
          </div>

          <AnchorButton href="/admin?section=companies" variant="secondary">
            ไปหน้าจัดการ
          </AnchorButton>
        </div>

        {message ? (
          <div className="max-w-3xl">
            <Alert message={message.text} tone={message.tone} />
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="บริษัท" value={companyStats} note="รายการที่ใช้สร้างการจอง" />
          <StatCard label="การจอง" value={interviewStats} note="รายการที่ระบบส่งกลับมา" />
          <StatCard label="ผู้ใช้" value={userStats} note="บัญชีที่เลือกทำการจองได้" />
        </div>

        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">สร้างการจอง</p>
              <h2 className="mt-2 font-display text-2xl text-ink-900">จองแทนผู้ใช้</h2>
            </div>
            <Badge tone={bookingReady ? 'accent' : 'neutral'}>
              {bookingReady ? 'พร้อมใช้งาน' : 'รอข้อมูล'}
            </Badge>
          </div>

          {bookingReady ? (
            <div className="space-y-4">
              <Field label="ผู้ใช้">
                <Select value={bookingUserId} onChange={(event) => setBookingUserId(event.target.value)}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {formatUserOption(user)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="บริษัท">
                <Select value={bookingCompanyId} onChange={(event) => setBookingCompanyId(event.target.value)}>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {formatCompanyOption(company)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="วันที่สัมภาษณ์">
                <Select value={bookingDate} onChange={(event) => setBookingDate(event.target.value)}>
                  {interviewOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button
                onClick={() => void createBooking()}
                disabled={busy || !bookingUserId || !bookingCompanyId}
                className="w-full"
              >
                {busy ? 'กำลังสร้าง...' : 'สร้างการจอง'}
              </Button>
            </div>
          ) : (
            <EmptyState
              title="ยังไม่พร้อมสร้างการจอง"
              description={
                users.length === 0
                  ? 'ยังไม่มีรายชื่อผู้ใช้ให้เลือก'
                  : 'ยังไม่มีรายชื่อบริษัทให้เลือก'
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
