'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  AnchorButton,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Panel,
  Select,
  Spinner,
  StatCard,
} from '@/components/shadcn-ui';
import {
  createBulkInterviews,
  deleteInterview,
  getCompanies,
  getInterviews,
  updateInterview,
} from '@/lib/api';
import { allowedInterviewOptions, formatDate } from '@/lib/date';
import type { Company, Interview } from '@/lib/types';
import { cn } from '@/lib/utils';

function interviewCompanyName(interview: Interview) {
  return typeof interview.company === 'string' ? interview.company : interview.company.name;
}

export function DashboardPage() {
  const { user, token, refresh } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkDate, setBulkDate] = useState<string>(allowedInterviewOptions()[0].value);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [editDate, setEditDate] = useState<string>(allowedInterviewOptions()[0].value);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [nextCompanies, nextInterviews] = await Promise.all([getCompanies(token), getInterviews(token)]);
      setCompanies(nextCompanies);
      setInterviews(nextInterviews);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void load();
  }, [load, token]);

  const bookedCompanyIds = useMemo(
    () =>
      new Set(
        interviews
          .map((interview) => (typeof interview.company === 'string' ? interview.company : interview.company.id))
          .filter(Boolean),
      ),
    [interviews],
  );

  const remainingSlots = user?.role === 'admin' ? 'ไม่จำกัด' : Math.max(0, 3 - interviews.length).toString();
  const bookedCount = interviews.length.toString();
  const roleLabel = user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้';

  const toggleCompany = (companyId: string, checked: boolean) => {
    if (!checked) {
      setSelectedCompanyIds((current) => current.filter((item) => item !== companyId));
      return;
    }

    if (selectedCompanyIds.length >= 3 && user?.role !== 'admin') {
      setFeedback('บัญชีผู้ใช้ปกติจองได้สูงสุด 3 บริษัทต่อครั้ง');
      return;
    }

    setSelectedCompanyIds((current) => [...current, companyId]);
  };

  const submitBulkBooking = async () => {
    if (!token || selectedCompanyIds.length === 0) {
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      await createBulkInterviews(token, selectedCompanyIds, bulkDate);
      setFeedback('จองหลายบริษัทเรียบร้อยแล้ว');
      setSelectedCompanyIds([]);
      await load();
      await refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'ไม่สามารถสร้างการจองแบบหลายบริษัทได้');
    } finally {
      setBusy(false);
    }
  };

  const submitInterviewUpdate = async () => {
    if (!token || !editingInterview) {
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      await updateInterview(token, editingInterview.id, editDate);
      setFeedback('อัปเดตรอบสัมภาษณ์แล้ว');
      setEditingInterview(null);
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตรอบสัมภาษณ์ได้');
    } finally {
      setBusy(false);
    }
  };

  const submitDeleteInterview = async (interviewId: string) => {
    if (!token) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await deleteInterview(token, interviewId);
      setFeedback('ลบรอบสัมภาษณ์แล้ว');
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'ไม่สามารถลบรอบสัมภาษณ์ได้');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-ink-900 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <Spinner label="กำลังโหลดแดชบอร์ด..." />
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

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="eyebrow">แดชบอร์ดส่วนตัว</p>
          <h1 className="font-display text-4xl text-ink-900">ยินดีต้อนรับ, {user.name}</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink-600">
            จัดการการจอง แก้ไขวัน และสร้างคำขอจองแบบหลายบริษัทได้ในหน้าจอนี้
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="บทบาท" value={roleLabel} note="ดึงค่าจากเซสชันที่ล็อกอินอยู่" />
          <StatCard label="การจองทั้งหมด" value={bookedCount} note="รายการที่ระบบส่งกลับมา" />
          <StatCard label="คงเหลือ" value={remainingSlots} note="บัญชีผู้ใช้ทั่วไปจองได้สูงสุด 3 ครั้ง" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-stretch">
          <Panel className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">จองหลายบริษัท</p>
                <h2 className="mt-2 font-display text-2xl text-ink-900">เลือกได้สูงสุด 3 บริษัท</h2>
              </div>
              <Badge tone="accent">{selectedCompanyIds.length}/3</Badge>
            </div>

            <div className="space-y-4">
              <Field label="วันที่สัมภาษณ์">
                <Select value={bulkDate} onChange={(event) => setBulkDate(event.target.value)}>
                  {allowedInterviewOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-3">
                {companies
                  .filter((company) => !bookedCompanyIds.has(company.id))
                  .map((company) => (
                    <Checkbox
                      key={company.id}
                      label={company.name}
                      description={`${company.address} • ${company.tel}`}
                      checked={selectedCompanyIds.includes(company.id)}
                      onChange={(checked) => toggleCompany(company.id, checked)}
                    />
                  ))}
              </div>

                {companies.length === 0 ? (
                <EmptyState
                  title="ยังไม่มีรายชื่อบริษัท"
                  description="ระบบยังไม่ส่งข้อมูลบริษัทมา"
                />
              ) : null}

              <Button
                onClick={() => void submitBulkBooking()}
                disabled={busy || selectedCompanyIds.length === 0 || user.role !== 'user'}
                className="w-full"
              >
                {busy ? 'กำลังส่ง...' : user.role === 'user' ? 'จองบริษัทที่เลือก' : 'ใช้ได้เฉพาะผู้ใช้'}
              </Button>
            </div>
          </Panel>

          <div className="flex h-full flex-col xl:pt-24">
            <Panel className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">การจองของคุณ</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-900">
                    {user.role === 'admin' ? 'การจองทั้งหมด' : 'การจองของฉัน'}
                  </h2>
                </div>
                {user.role === 'admin' ? (
                  <AnchorButton href="/admin" variant="secondary">
                    เครื่องมือแอดมิน
                  </AnchorButton>
                ) : null}
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
                  {feedback}
                </div>
              ) : null}

              {editingInterview ? (
                <div className="space-y-3 rounded-2xl border border-accent-200 bg-accent-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">แก้ไขการจอง</p>
                      <p className="text-xs text-ink-600">{interviewCompanyName(editingInterview)}</p>
                    </div>
                    <button type="button" className="text-sm font-semibold text-ink-600" onClick={() => setEditingInterview(null)}>
                      ยกเลิก
                    </button>
                  </div>
                  <Field label="วันที่สัมภาษณ์ใหม่">
                    <Select value={editDate} onChange={(event) => setEditDate(event.target.value)}>
                      {allowedInterviewOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button onClick={() => void submitInterviewUpdate()} disabled={busy} className="w-full">
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </div>
              ) : null}

              {interviews.length === 0 ? (
                <EmptyState
                  title="ยังไม่มีการจอง"
                  description="รายการจองของคุณจะแสดงที่นี่"
                />
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className={cn('rounded-2xl border border-ink-200 bg-white p-4', editingInterview?.id === interview.id && 'border-accent-300')}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-ink-900">{interviewCompanyName(interview)}</p>
                          <p className="text-sm text-ink-500">{formatDate(interview.date)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingInterview(interview);
                              setEditDate(new Date(interview.date).toISOString());
                            }}
                          >
                            แก้ไข
                          </Button>
                          <Button variant="danger" onClick={() => void submitDeleteInterview(interview.id)} disabled={busy}>
                            ลบ
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
