'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  AnchorButton,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Panel,
  Select,
  Spinner,
  StatCard,
  Textarea,
} from '@/components/shadcn-ui';
import {
  createCompany,
  deleteCompany,
  deleteInterview,
  getCompanies,
  getInterviews,
  updateCompany,
  updateInterview,
} from '@/lib/api';
import { allowedInterviewOptions, formatDate } from '@/lib/date';
import type { Company, Interview } from '@/lib/types';
import { cn } from '@/lib/utils';

type CompanyForm = {
  name: string;
  address: string;
  website: string;
  description: string;
  tel: string;
};

const emptyCompanyForm: CompanyForm = {
  name: '',
  address: '',
  website: '',
  description: '',
  tel: '',
};

function interviewCompanyName(interview: Interview) {
  return typeof interview.company === 'string' ? interview.company : interview.company.name;
}

export function AdminPage() {
  const { token, refresh } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>(allowedInterviewOptions()[0].value);

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
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลแอดมินได้');
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

  const companyStats = useMemo(() => companies.length.toString(), [companies.length]);
  const interviewStats = useMemo(() => interviews.length.toString(), [interviews.length]);

  const saveCompany = async () => {
    if (!token) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        name: companyForm.name.trim(),
        address: companyForm.address.trim(),
        website: companyForm.website.trim() || undefined,
        description: companyForm.description.trim(),
        tel: companyForm.tel.trim(),
      };

      if (editingCompanyId) {
        await updateCompany(token, editingCompanyId, payload);
        setMessage('อัปเดตบริษัทแล้ว');
      } else {
        await createCompany(token, payload);
        setMessage('สร้างบริษัทแล้ว');
      }

      setCompanyForm(emptyCompanyForm);
      setEditingCompanyId(null);
      await load();
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'ไม่สามารถบันทึกบริษัทได้');
    } finally {
      setBusy(false);
    }
  };

  const editCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      address: company.address,
      website: company.website ?? '',
      description: company.description,
      tel: company.tel,
    });
  };

  const removeCompany = async (companyId: string) => {
    if (!token) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await deleteCompany(token, companyId);
      setMessage('ลบบริษัทแล้ว');
      await load();
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'ไม่สามารถลบบริษัทได้');
    } finally {
      setBusy(false);
    }
  };

  const saveInterview = async () => {
    if (!token || !selectedInterview) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await updateInterview(token, selectedInterview.id, interviewDate);
      setMessage('อัปเดตรอบสัมภาษณ์แล้ว');
      setSelectedInterview(null);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตรอบสัมภาษณ์ได้');
    } finally {
      setBusy(false);
    }
  };

  const removeInterview = async (interviewId: string) => {
    if (!token) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await deleteInterview(token, interviewId);
      setMessage('ลบรอบสัมภาษณ์แล้ว');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'ไม่สามารถลบรอบสัมภาษณ์ได้');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <Spinner label="กำลังโหลดแดชบอร์ดแอดมิน..." />
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
        <div className="space-y-4">
          <p className="eyebrow text-white/70">แดชบอร์ดแอดมิน</p>
          <h1 className="font-display text-4xl text-white">จัดการบริษัทและรอบสัมภาษณ์</h1>
          <p className="max-w-3xl text-sm leading-6 text-white/70">
            หน้านี้ใช้จัดการข้อมูลบริษัทและรอบสัมภาษณ์ทั้งหมด
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="บริษัท" value={companyStats} note="รายการที่ระบบส่งกลับมา" />
          <StatCard label="การจอง" value={interviewStats} note="รายการที่เห็นได้ในเซสชันปัจจุบัน" />
          <StatCard label="บทบาท" value="ผู้ดูแลระบบ" note="เส้นทางนี้ใช้ได้เฉพาะแอดมิน" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">แก้ไขบริษัท</p>
                <h2 className="mt-2 font-display text-2xl text-ink-900">
                  {editingCompanyId ? 'แก้ไขบริษัท' : 'สร้างบริษัท'}
                </h2>
              </div>
              {editingCompanyId ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-ink-600"
                  onClick={() => {
                    setEditingCompanyId(null);
                    setCompanyForm(emptyCompanyForm);
                  }}
                >
                  ล้างค่า
                </button>
              ) : null}
            </div>

            {message ? (
              <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
                {message}
              </div>
            ) : null}

            <div className="space-y-4">
              <Field label="ชื่อบริษัท">
                <Input
                  value={companyForm.name}
                  onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })}
                  placeholder="บริษัทตัวอย่าง"
                  required
                />
              </Field>
              <Field label="ที่อยู่">
                <Input
                  value={companyForm.address}
                  onChange={(event) => setCompanyForm({ ...companyForm, address: event.target.value })}
                  placeholder="กรุงเทพมหานคร"
                  required
                />
              </Field>
              <Field label="เว็บไซต์">
                <Input
                  value={companyForm.website}
                  onChange={(event) => setCompanyForm({ ...companyForm, website: event.target.value })}
                  placeholder="https://example.com"
                />
              </Field>
              <Field label="เบอร์โทรศัพท์">
                <Input
                  value={companyForm.tel}
                  onChange={(event) => setCompanyForm({ ...companyForm, tel: event.target.value })}
                  placeholder="021234567"
                  required
                />
              </Field>
              <Field label="รายละเอียด">
                <Textarea
                  value={companyForm.description}
                  onChange={(event) => setCompanyForm({ ...companyForm, description: event.target.value })}
                  placeholder="บริษัทนี้ทำอะไร"
                  required
                />
              </Field>
            </div>

            <Button className="w-full" onClick={() => void saveCompany()} disabled={busy}>
              {busy ? 'กำลังบันทึก...' : editingCompanyId ? 'อัปเดตบริษัท' : 'สร้างบริษัท'}
            </Button>
          </Panel>

          <div className="space-y-8">
            <Panel className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">บริษัท</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-900">รายการบริษัท</h2>
                </div>
                <Badge tone="accent">{companies.length}</Badge>
              </div>

              {companies.length === 0 ? (
                <EmptyState
                  title="ยังไม่มีบริษัท"
                  description="สร้างบริษัทแรกเพื่อให้แสดงในรายชื่อ"
                />
              ) : (
                <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-ink-900">{company.name}</p>
                          <p className="mt-1 text-sm text-ink-500">{company.address}</p>
                          <p className="mt-1 text-sm text-ink-600">{company.tel}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AnchorButton href={`/companies/${company.id}`} variant="secondary">
                            ดู
                          </AnchorButton>
                          <Button type="button" variant="outline" onClick={() => editCompany(company)}>
                            แก้ไข
                          </Button>
                          <Button variant="danger" onClick={() => void removeCompany(company.id)} disabled={busy}>
                            ลบ
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">รอบสัมภาษณ์</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-900">ตรวจสอบการจอง</h2>
                </div>
                <Badge tone="warm">{interviews.length}</Badge>
              </div>

              {selectedInterview ? (
                <div className="space-y-3 rounded-2xl border border-accent-200 bg-accent-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">แก้ไขรอบสัมภาษณ์</p>
                      <p className="text-xs text-ink-600">{interviewCompanyName(selectedInterview)}</p>
                    </div>
                    <button type="button" className="text-sm font-semibold text-ink-600" onClick={() => setSelectedInterview(null)}>
                      ยกเลิก
                    </button>
                  </div>
                  <Field label="วันที่สัมภาษณ์">
                    <Select
                      value={interviewDate}
                      onChange={(event) => setInterviewDate(event.target.value)}
                    >
                      {allowedInterviewOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button onClick={() => void saveInterview()} disabled={busy} className="w-full">
                    บันทึกการจอง
                  </Button>
                </div>
              ) : null}

              {interviews.length === 0 ? (
                <EmptyState title="ยังไม่มีการจอง" description="รายการจองจะแสดงที่นี่เมื่อมีการจองเข้ามา" />
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-medium text-ink-900">{interviewCompanyName(interview)}</p>
                          <p className="text-sm text-ink-500">{formatDate(interview.date)}</p>
                          <p className="mt-1 text-xs font-medium text-ink-400">
                            {typeof interview.user === 'string' ? interview.user : interview.user.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                            setSelectedInterview(interview);
                            setInterviewDate(new Date(interview.date).toISOString());
                          }}
                        >
                            แก้ไข
                          </Button>
                          <Button variant="danger" onClick={() => void removeInterview(interview.id)} disabled={busy}>
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
