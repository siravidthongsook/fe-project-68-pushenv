'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOptionalAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import { AnchorButton, Badge, Button, EmptyState, Field, Panel, Select, Spinner } from '@/components/shadcn-ui';
import { createInterview, getCompany, getInterviewSlots } from '@/lib/api';
import { formatDate, interviewOptions } from '@/lib/date';
import type { BookingSlot, Company } from '@/lib/types';

export function CompanyDetail({ id }: { id: string }) {
  const auth = useOptionalAuth();
  const toast = useToast();
  const user = auth?.user ?? null;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(interviewOptions[0].value);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([...interviewOptions]);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  useEffect(() => {
    if (!canBook || !auth?.token) {
      return;
    }

    let active = true;

    getInterviewSlots(auth.token)
      .then((slots) => {
        if (active && slots.length > 0) {
          setBookingSlots(slots);
        }
      })
      .catch(() => {
        if (active) {
          setBookingSlots([...interviewOptions]);
        }
      });

    return () => {
      active = false;
    };
  }, [auth?.token, canBook]);

  useEffect(() => {
    if (!bookingSlots.some((slot) => slot.value === bookingDate)) {
      setBookingDate(bookingSlots[0]?.value ?? '');
    }
  }, [bookingDate, bookingSlots]);

  const interviewCount = company?.bookingCount ?? 0;
  const myInterview = useMemo(
    () => company?.interview.find((interview) => interview.user.id === user?.id) ?? null,
    [company?.interview, user?.id],
  );
  const hasBookedThisCompany = canBook && myInterview !== null;

  const bookedDates = useMemo(
    () => new Set((company?.interview ?? []).map((item) => new Date(item.date).toISOString().slice(0, 10))),
    [company?.interview],
  );

  const submitBooking = async () => {
    if (!auth?.token || !company) {
      return;
    }

    setSubmitting(true);

    try {
      await createInterview(auth.token, company.id, bookingDate);
      toast.success('จองสัมภาษณ์เรียบร้อยแล้ว');
      const refreshed = await getCompany(id, auth.token);
      setCompany(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ไม่สามารถจองสัมภาษณ์ได้');
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
          description={error ? 'โหลดข้อมูลบริษัทไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'บริษัทนี้ไม่มีอยู่หรือคุณไม่มีสิทธิ์เข้าถึง'}
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
              <h2 className="text-lg font-semibold text-ink-900">
                {hasBookedThisCompany ? 'การจองของคุณ' : 'ประวัติการจอง'}
              </h2>
              <Badge tone="neutral">{hasBookedThisCompany ? 'Booked' : `${bookedDates.size} วันที่`}</Badge>
            </div>

            {hasBookedThisCompany && myInterview ? (
              <div className="rounded-3xl border border-accent-200 bg-accent-50 p-5">
                <p className="text-sm font-semibold text-accent-900">คุณจองบริษัทนี้แล้ว</p>
                <p className="mt-2 text-lg font-semibold text-ink-900">{formatDate(myInterview.date)}</p>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  รายการนี้อยู่ในแดชบอร์ดของคุณแล้ว หากต้องการเปลี่ยนวันหรือยกเลิก ให้จัดการจากหน้ารายการจองของคุณ
                </p>
              </div>
            ) : company.interview.length === 0 ? (
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

            {hasBookedThisCompany && myInterview ? (
              <div className="space-y-4 rounded-3xl border border-accent-200 bg-accent-50 p-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-accent-900">Booked</p>
                  <h3 className="text-2xl font-semibold text-ink-900">คุณจองบริษัทนี้แล้ว</h3>
                  <p className="text-sm leading-6 text-ink-700">
                    รอบสัมภาษณ์ของคุณถูกบันทึกไว้แล้วที่ {formatDate(myInterview.date)} จึงไม่สามารถจองบริษัทเดิมซ้ำจากหน้านี้ได้
                  </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-500">รายการของคุณ</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(myInterview.date)}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <AnchorButton href="/dashboard?section=bookings">ไปที่รายการจองของฉัน</AnchorButton>
                  <AnchorButton href="/dashboard?section=bookings" variant="secondary">
                    เปลี่ยนวันหรือจัดการรายการ
                  </AnchorButton>
                </div>
              </div>
            ) : canBook ? (
              <div className="space-y-4">
                <Field label="วันที่สัมภาษณ์" hint={`มีให้เลือก ${bookingSlots.length} ช่วงเวลา`}>
                  <Select value={bookingDate} onChange={(event) => setBookingDate(event.target.value)}>
                    {bookingSlots.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button onClick={() => void submitBooking()} disabled={submitting || !bookingDate} className="w-full">
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
