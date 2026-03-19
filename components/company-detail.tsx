'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth, useOptionalAuth } from '@/components/auth-provider';
import { AnchorButton, Badge, Button, EmptyState, Field, Panel, Select, Spinner } from '@/components/shadcn-ui';
import { createInterview, getCompany } from '@/lib/api';
import { allowedInterviewOptions, formatDate } from '@/lib/date';
import type { Company } from '@/lib/types';

export function CompanyDetail({ id }: { id: string }) {
  const auth = useOptionalAuth();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(allowedInterviewOptions()[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const canBook = user?.role === 'user';

  useEffect(() => {
    let active = true;
    setLoading(true);

    getCompany(id, auth?.token ?? null)
      .then((result) => {
        if (!active) {
          return;
        }
        setCompany(result);
        setError(null);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลบริษัทได้');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth?.token, id]);

  const interviewCount = company?.bookingCount ?? 0;

  const bookedDates = useMemo(
    () => new Set((company?.interview ?? []).map((item) => new Date(item.date).toISOString().slice(0, 10))),
    [company?.interview],
  );

  const submitBooking = async () => {
    if (!auth?.token || !company) {
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      await createInterview(auth.token, company.id, bookingDate);
      setNotice('จองสัมภาษณ์เรียบร้อยแล้ว');
      const refreshed = await getCompany(id, auth.token);
      setCompany(refreshed);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'ไม่สามารถจองสัมภาษณ์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <Spinner label="กำลังโหลดข้อมูลบริษัท..." />
        </Panel>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <EmptyState
          title="ไม่พบบริษัท"
          description={error || 'บริษัทนี้ไม่มีอยู่หรือคุณไม่มีสิทธิ์เข้าถึง'}
          action={<AnchorButton href="/companies" variant="secondary">กลับไปรายชื่อบริษัท</AnchorButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="space-y-6 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
              <p className="eyebrow">โปรไฟล์บริษัท</p>
              <h1 className="font-display text-4xl text-ink-900">{company.name}</h1>
              <p className="text-sm text-ink-500">{company.address}</p>
            </div>
            <Badge tone="accent">{interviewCount} การจอง</Badge>
          </div>

          <p className="text-sm leading-7 text-ink-600">{company.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-ink-500">เบอร์โทรศัพท์</p>
              <p className="mt-2 text-sm font-medium text-ink-900">{company.tel}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-ink-500">เว็บไซต์</p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-accent-700 underline">
                    {company.website}
                  </a>
                ) : (
                  'ไม่มีข้อมูล'
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">ประวัติการจอง</h2>
              <Badge tone="neutral">{bookedDates.size} วันที่</Badge>
            </div>
            {company.interview.length === 0 ? (
              <EmptyState
                title="ยังไม่มีการจอง"
                description="บริษัทนี้ยังไม่มีรอบสัมภาษณ์"
              />
            ) : (
              <div className="space-y-3">
                {company.interview.map((interview) => (
                  <div key={interview.id} className="rounded-2xl border border-ink-200 bg-white px-4 py-4">
                    <p className="font-medium text-ink-900">{formatDate(interview.date)}</p>
                    <p className="mt-1 text-sm text-ink-500">บันทึกรายการจองในระบบแล้ว</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-4 p-6">
            <div>
              <p className="eyebrow">การดำเนินการ</p>
              <h2 className="mt-2 font-display text-2xl text-ink-900">จองสัมภาษณ์</h2>
            </div>

            {notice ? (
              <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
                {notice}
              </div>
            ) : null}

            {canBook ? (
              <div className="space-y-4">
                <Field label="วันที่สัมภาษณ์" hint="มีให้เลือก 4 วัน">
                  <Select value={bookingDate} onChange={(event) => setBookingDate(event.target.value)}>
                    {allowedInterviewOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button onClick={() => void submitBooking()} disabled={submitting} className="w-full">
                  {submitting ? 'กำลังจอง...' : 'จองบริษัทนี้'}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                การจองใช้ได้เฉพาะบัญชีผู้ใช้ ส่วนบัญชีผู้ดูแลจัดการข้อมูลบริษัทและรอบสัมภาษณ์ได้จากแดชบอร์ดแอดมิน
              </div>
            )}
          </Panel>

          <Panel className="space-y-4 p-6">
            <p className="eyebrow">การนำทาง</p>
            <div className="flex flex-wrap gap-3">
              <AnchorButton href="/companies" variant="secondary">
                กลับไปรายชื่อบริษัท
              </AnchorButton>
              {user ? (
                <AnchorButton href={user.role === 'admin' ? '/admin' : '/dashboard'} variant="secondary">
                  ไปยัง{user.role === 'admin' ? 'ผู้ดูแล' : 'แดชบอร์ด'}
                </AnchorButton>
              ) : (
                <AnchorButton href="/login" variant="secondary">
                  เข้าสู่ระบบเพื่อจอง
                </AnchorButton>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
