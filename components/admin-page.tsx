'use client';

import { useEffect, useState } from 'react';
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
  createInterview,
  deleteCompany,
  deleteInterview,
  getCompanies,
  getInterviews,
  getUsers,
  updateCompany,
  updateInterview,
} from '@/lib/api';
import { formatDate, interviewOptions } from '@/lib/date';
import type { Company, Interview, User } from '@/lib/types';
import { cn, interviewCompanyName } from '@/lib/utils';
import { useAsync } from '@/hooks/use-async';
import { Alert } from '@/components/alert';
import { DeleteButton } from '@/components/delete-button';

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
  const { token, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editInterviewDate, setEditInterviewDate] = useState<string>(interviewOptions[0].value);
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
        setMessage({ text: 'อัปเดตบริษัทแล้ว', tone: 'success' });
      } else {
        await createCompany(token, payload);
        setMessage({ text: 'สร้างบริษัทแล้ว', tone: 'success' });
      }

      setCompanyForm(emptyCompanyForm);
      setEditingCompanyId(null);
      await reload();
      await refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'ไม่สามารถบันทึกได้', tone: 'error' });
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
      setMessage({ text: 'ลบบริษัทแล้ว', tone: 'success' });
      await reload();
      await refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'ไม่สามารถลบบริษัทได้', tone: 'error' });
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
      await updateInterview(token, selectedInterview.id, editInterviewDate);
      setMessage({ text: 'อัปเดตรอบสัมภาษณ์แล้ว', tone: 'success' });
      setSelectedInterview(null);
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'ไม่สามารถอัปเดตรอบสัมภาษณ์ได้', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

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

  const removeInterview = async (interviewId: string) => {
    if (!token) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await deleteInterview(token, interviewId);
      setMessage({ text: 'ลบรอบสัมภาษณ์แล้ว', tone: 'success' });
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'ไม่สามารถลบรอบสัมภาษณ์ได้', tone: 'error' });
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
        <div className="space-y-4 text-black">
          <p className="eyebrow">แดชบอร์ดแอดมิน</p>
          <h1 className="font-display text-4xl">จัดการบริษัทและทุกการจอง</h1>
          <p className="max-w-3xl text-sm leading-6">
            หน้านี้ใช้แก้ไขบริษัท ตรวจสอบการจองทั้งหมด และสร้างการจองให้ผู้ใช้คนใดก็ได้
          </p>
        </div>

        {message ? (
          <div className="max-w-3xl">
            <Alert message={message.text} tone={message.tone} />
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="บริษัท" value={companyStats} note="รายการที่ระบบส่งกลับมา" />
          <StatCard label="การจอง" value={interviewStats} note="การจองทั้งหมดในระบบ" />
          <StatCard label="ผู้ใช้" value={userStats} note="บัญชีที่เลือกทำการจองได้" />
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
                  <p className="eyebrow">สร้างการจอง</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-900">จองแทนผู้ใช้</h2>
                </div>
                <Badge tone="accent">{bookingUserId && bookingCompanyId ? 'พร้อมใช้งาน' : 'รอข้อมูล'}</Badge>
              </div>

              {users.length === 0 || companies.length === 0 ? (
                <EmptyState
                  title="ยังไม่พร้อมสร้างการจอง"
                  description={
                    users.length === 0
                      ? 'ยังไม่มีรายชื่อผู้ใช้ให้เลือก'
                      : 'ยังไม่มีรายชื่อบริษัทให้เลือก'
                  }
                />
              ) : (
                <div className="space-y-4">
                  <Field label="ผู้ใช้">
                    <Select
                      value={bookingUserId}
                      onChange={(event) => setBookingUserId(event.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {formatUserOption(user)}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="บริษัท">
                    <Select
                      value={bookingCompanyId}
                      onChange={(event) => setBookingCompanyId(event.target.value)}
                    >
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
              )}
            </Panel>

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
                          <DeleteButton onConfirm={() => void removeCompany(company.id)} disabled={busy} />
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
                    <button
                      type="button"
                      className="text-sm font-semibold text-ink-600"
                      onClick={() => setSelectedInterview(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <Field label="วันที่สัมภาษณ์">
                    <Select
                      value={editInterviewDate}
                      onChange={(event) => setEditInterviewDate(event.target.value)}
                    >
                      {interviewOptions.map((option) => (
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
                        <div className="space-y-1">
                          <p className="font-medium text-ink-900">{interviewCompanyName(interview)}</p>
                          <p className="text-sm text-ink-500">{formatDate(interview.date)}</p>
                          <p className="text-xs font-medium text-ink-400">
                            จองโดย {interview.user.name || interview.user.email}
                            {interview.user.email ? ` • ${interview.user.email}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedInterview(interview);
                              setEditInterviewDate(new Date(interview.date).toISOString());
                            }}
                          >
                            แก้ไข
                          </Button>
                          <DeleteButton onConfirm={() => void removeInterview(interview.id)} disabled={busy} />
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
