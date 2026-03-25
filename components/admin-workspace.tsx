'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import { DeleteButton } from '@/components/delete-button';
import { SearchSelectField } from '@/components/search-select-picker';
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
  deleteUser,
  getCompanies,
  getInterviews,
  getInterviewSlots,
  getUsers,
  updateCompany,
  updateInterview,
  updateUser,
} from '@/lib/api';
import { formatDate } from '@/lib/date';
import type { BookingSlot, Company, Interview, Role, User } from '@/lib/types';
import { useAsync } from '@/hooks/use-async';
import { cn, interviewCompanyName } from '@/lib/utils';

type AdminSectionKey = 'bookings' | 'companies' | 'users';
type CompanyFormState = {
  name: string;
  address: string;
  website: string;
  description: string;
  tel: string;
};

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_INTERVIEWS: Interview[] = [];
const EMPTY_USERS: User[] = [];
const EMPTY_SLOTS: BookingSlot[] = [];
const EMPTY_COMPANY_FORM: CompanyFormState = {
  name: '',
  address: '',
  website: '',
  description: '',
  tel: '',
};
const SECTION_OPTIONS: Array<{ key: AdminSectionKey; label: string; note: string }> = [
  { key: 'bookings', label: 'Bookings', note: 'สร้าง ปรับวัน และยกเลิกการจอง' },
  { key: 'companies', label: 'Companies', note: 'ดูแลข้อมูลบริษัทและผลกระทบต่อการจอง' },
  { key: 'users', label: 'Users', note: 'กำหนดบทบาทและตรวจสอบประวัติการจอง' },
];

function formatRoleLabel(role: Role) {
  return role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้';
}

function buildSectionHref(pathname: string, searchParams: URLSearchParams, section: AdminSectionKey) {
  const next = new URLSearchParams(searchParams.toString());
  next.set('section', section);
  return `${pathname}?${next.toString()}`;
}

function parseSection(value: string | null): AdminSectionKey {
  return value === 'companies' || value === 'users' ? value : 'bookings';
}

function findFirstSlot(slots: BookingSlot[]) {
  return slots[0]?.value ?? '';
}

function userDisplayName(user: User) {
  return user.name || user.email;
}

function userSelectionSummary(user: User) {
  return `${userDisplayName(user)} • ${user.email}`;
}

function SectionTabs({
  activeSection,
  onChange,
}: {
  activeSection: AdminSectionKey;
  onChange: (section: AdminSectionKey) => void;
}) {
  return (
    <div className="sticky top-[73px] z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid gap-2 md:grid-cols-3">
          {SECTION_OPTIONS.map((section) => {
            const active = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onChange(section.key)}
                className={cn(
                  'rounded-2xl border px-4 py-4 text-left transition-colors',
                  active
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300',
                )}
              >
                <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-zinc-900')}>
                  {section.label}
                </p>
                <p className={cn('mt-1 text-xs leading-5', active ? 'text-white/80' : 'text-zinc-500')}>
                  {section.note}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SideSheet({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 !mt-0">
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-200 bg-white">
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Admin Workspace</p>
              <h2 className="mt-2 font-display text-2xl text-ink-900">{title}</h2>
              {description ? <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p> : null}
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
        <div className="space-y-6 px-5 py-5 sm:px-6">{children}</div>
      </aside>
    </div>
  );
}

function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.08)]">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
}

function BookingsSection({
  token,
  bookingSlots,
  companies,
  interviews,
  users,
  onReload,
}: {
  token: string;
  bookingSlots: BookingSlot[];
  companies: Company[];
  interviews: Interview[];
  users: User[];
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [mode, setMode] = useState<'create' | 'edit' | 'user' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [createUserId, setCreateUserId] = useState('');
  const [createCompanyId, setCreateCompanyId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const bookableUsers = useMemo(
    () => users.filter((user) => user.role === 'user'),
    [users],
  );

  useEffect(() => {
    if (!bookableUsers.some((user) => user.id === createUserId)) {
      setCreateUserId(bookableUsers[0]?.id ?? '');
    }
  }, [bookableUsers, createUserId]);

  useEffect(() => {
    if (!companies.some((company) => company.id === createCompanyId)) {
      setCreateCompanyId(companies[0]?.id ?? '');
    }
  }, [companies, createCompanyId]);

  useEffect(() => {
    const validDates = new Set(bookingSlots.map((slot) => slot.value));
    if (!validDates.has(selectedDate)) {
      setSelectedDate(findFirstSlot(bookingSlots));
    }
  }, [bookingSlots, selectedDate]);

  const filteredInterviews = useMemo(() => {
    const term = query.trim().toLowerCase();
    return interviews.filter((interview) => {
      if (companyFilter !== 'all' && interview.company.id !== companyFilter) {
        return false;
      }
      if (userFilter !== 'all' && interview.user.id !== userFilter) {
        return false;
      }
      if (dateFilter !== 'all' && interview.date !== dateFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        interview.company.name,
        interview.user.name,
        interview.user.email,
        formatDate(interview.date),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [companyFilter, dateFilter, interviews, query, userFilter]);

  const focusedUser = users.find((user) => user.id === focusedUserId) ?? null;
  const focusedUserBookings = useMemo(
    () => interviews.filter((interview) => interview.user.id === focusedUserId),
    [focusedUserId, interviews],
  );

  const closeSheet = () => {
    setMode(null);
    setSelectedInterview(null);
    setFocusedUserId(null);
  };

  const openCreate = () => {
    setSelectedInterview(null);
    setMode('create');
  };

  const openEdit = (interview: Interview) => {
    setSelectedInterview(interview);
    setSelectedDate(interview.date);
    setMode('edit');
  };

  const openUser = (userId: string) => {
    setFocusedUserId(userId);
    setMode('user');
  };

  const submitBooking = async () => {
    if (!selectedDate) {
      toast.error('ยังไม่มีช่วงเวลาสัมภาษณ์ให้เลือก');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'create') {
        await createInterview(token, createCompanyId, selectedDate, createUserId);
        toast.success('สร้างการจองเรียบร้อยแล้ว');
      } else if (mode === 'edit' && selectedInterview) {
        await updateInterview(token, selectedInterview.id, selectedDate);
        toast.success('ปรับวันสัมภาษณ์เรียบร้อยแล้ว');
      }

      closeSheet();
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการจองได้');
    } finally {
      setSubmitting(false);
    }
  };

  const removeBooking = async (interviewId: string) => {
    setBusyId(interviewId);

    try {
      await deleteInterview(token, interviewId);
      toast.success('ยกเลิกการจองเรียบร้อยแล้ว');
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถยกเลิกการจองได้');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">Bookings</p>
          <h2 className="font-display text-3xl text-ink-900">จัดการการจองทั้งหมด</h2>
          <p className="max-w-3xl text-sm leading-6 text-ink-600">
            ค้นหา กรอง ปรับวัน และสร้างการจองแทนผู้ใช้จากจุดเดียว
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Create booking
        </Button>
      </div>
      <Panel className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาจากบริษัท ผู้ใช้ หรืออีเมล"
          />
          <Select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
            <option value="all">ทุกบริษัท</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
          <Select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
            <option value="all">ทุกผู้ใช้</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userDisplayName(user)}
              </option>
            ))}
          </Select>
          <Select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
            <option value="all">ทุกช่วงเวลา</option>
            {bookingSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      {filteredInterviews.length === 0 ? (
        <EmptyState
          title="ไม่พบการจองที่ตรงเงื่อนไข"
          description="ลองปรับคำค้นหาหรือรีเซ็ตตัวกรองเพื่อดูรายการทั้งหมด"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery('');
                setCompanyFilter('all');
                setUserFilter('all');
                setDateFilter('all');
              }}
            >
              ล้างตัวกรอง
            </Button>
          }
        />
      ) : (
        <DataTable columns={['บริษัท', 'ผู้ใช้', 'วันสัมภาษณ์', 'สร้างเมื่อ', 'จัดการ']}>
          {filteredInterviews.map((interview) => (
            <tr key={interview.id} className="align-top">
              <td className="px-4 py-4">
                <p className="font-medium text-ink-900">{interviewCompanyName(interview)}</p>
                <p className="mt-1 text-xs text-ink-500">{interview.company.address}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-ink-900">{userDisplayName(interview.user)}</p>
                <p className="mt-1 text-xs text-ink-500">{interview.user.email}</p>
              </td>
              <td className="px-4 py-4 text-sm text-ink-700">{formatDate(interview.date)}</td>
              <td className="px-4 py-4 text-sm text-ink-700">
                {interview.createdAt ? formatDate(interview.createdAt) : 'ไม่มีข้อมูล'}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => openEdit(interview)}>
                    Reschedule
                  </Button>
                  <Button type="button" variant="outline" onClick={() => openUser(interview.user.id)}>
                    View user
                  </Button>
                  <DeleteButton
                    onConfirm={() => void removeBooking(interview.id)}
                    disabled={busyId === interview.id}
                    description="ยกเลิกการจองนี้หรือไม่?"
                    triggerText="Cancel"
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <SideSheet
        open={mode !== null}
        onClose={closeSheet}
        title={
          mode === 'create'
            ? 'Create booking'
            : mode === 'edit'
              ? 'Reschedule booking'
              : 'User detail'
        }
        description={
          mode === 'create'
            ? 'เลือกผู้ใช้ บริษัท และช่วงเวลาจากข้อมูลที่ระบบอนุญาต'
            : mode === 'edit'
              ? 'ปรับเฉพาะช่วงเวลาสัมภาษณ์ โดยรักษาคู่ผู้ใช้และบริษัทเดิมไว้'
              : 'ดูข้อมูลผู้ใช้และรายการจองของบัญชีนี้จากในหน้าเดียว'
        }
      >
        {mode === 'user' && focusedUser ? (
          <div className="space-y-6">
            <Panel className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink-900">{userDisplayName(focusedUser)}</p>
                  <p className="text-sm text-ink-500">{focusedUser.email}</p>
                </div>
                <Badge tone="warm">{formatRoleLabel(focusedUser.role)}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-500">โทรศัพท์</p>
                  <p className="mt-2 text-sm text-ink-900">{focusedUser.telephone || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-500">การจอง</p>
                  <p className="mt-2 text-sm text-ink-900">{focusedUser.bookingCount} รายการ</p>
                </div>
              </div>
            </Panel>

            {focusedUserBookings.length === 0 ? (
              <EmptyState
                title="ผู้ใช้นี้ยังไม่มีการจอง"
                description="เมื่อมีการจองใหม่ รายการจะแสดงที่นี่ทันที"
              />
            ) : (
              <DataTable columns={['บริษัท', 'วันสัมภาษณ์', 'สร้างเมื่อ']}>
                {focusedUserBookings.map((interview) => (
                  <tr key={interview.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink-900">{interview.company.name}</p>
                      <p className="mt-1 text-xs text-ink-500">{interview.company.address}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-ink-700">{formatDate(interview.date)}</td>
                    <td className="px-4 py-4 text-sm text-ink-700">
                      {interview.createdAt ? formatDate(interview.createdAt) : 'ไม่มีข้อมูล'}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        ) : null}

        {mode === 'create' ? (
          <div className="space-y-5">
            <div>
              <Field label="ผู้ใช้">
                <SearchSelectField
                  title="เลือกผู้ใช้สำหรับการจอง"
                  description="แสดงเฉพาะบัญชีผู้ใช้ปกติที่พร้อมรับการจอง"
                  items={bookableUsers}
                  selectedId={createUserId}
                  placeholder="ค้นหาและเลือกผู้ใช้"
                  searchPlaceholder="ค้นหาจากชื่อ อีเมล หรือเบอร์โทร"
                  emptyTitle="ไม่พบผู้ใช้ที่ตรงคำค้นหา"
                  emptyDescription="ลองค้นหาด้วยชื่อ อีเมล หรือเบอร์โทรอื่น"
                  getId={(user) => user.id}
                  getSearchText={(user) => [user.name, user.email, user.telephone].join(' ')}
                  renderSelection={(user) => (
                    <div className="space-y-1">
                      <p className="truncate text-sm font-semibold text-zinc-950">{userSelectionSummary(user)}</p>
                      <p className="text-xs text-zinc-500">{user.bookingCount} การจอง • {user.telephone || 'ไม่มีเบอร์โทร'}</p>
                    </div>
                  )}
                  renderItem={(user, state) => (
                    <div className="space-y-1">
                      <p className={cn('truncate text-sm font-semibold', state.active || state.selected ? 'text-white' : 'text-zinc-950')}>
                        {userSelectionSummary(user)}
                      </p>
                      <p className={cn('text-xs', state.active || state.selected ? 'text-white/80' : 'text-zinc-500')}>
                        {user.telephone || 'ไม่มีเบอร์โทร'} • {user.bookingCount} การจอง
                      </p>
                    </div>
                  )}
                  onSelect={(user) => setCreateUserId(user.id)}
                  disabled={bookableUsers.length === 0}
                />
              </Field>
            </div>
            <div>
              <Field label="บริษัท">
                <SearchSelectField
                  title="เลือกบริษัทสำหรับการจอง"
                  description="ค้นหาบริษัทจากชื่อ ที่อยู่ หรือเบอร์โทร"
                  items={companies}
                  selectedId={createCompanyId}
                  placeholder="ค้นหาและเลือกบริษัท"
                  searchPlaceholder="ค้นหาจากชื่อบริษัท ที่อยู่ หรือเบอร์โทร"
                  emptyTitle="ไม่พบบริษัทที่ตรงคำค้นหา"
                  emptyDescription="ลองค้นหาด้วยชื่อบริษัทหรือข้อมูลติดต่ออื่น"
                  getId={(company) => company.id}
                  getSearchText={(company) => [company.name, company.address, company.tel].join(' ')}
                  renderSelection={(company) => (
                    <div className="space-y-1">
                      <p className="truncate text-sm font-semibold text-zinc-950">{company.name}</p>
                      <p className="truncate text-xs text-zinc-500">{company.address} • {company.bookingCount} การจอง</p>
                    </div>
                  )}
                  renderItem={(company, state) => (
                    <div className="space-y-1">
                      <p className={cn('truncate text-sm font-semibold', state.active || state.selected ? 'text-white' : 'text-zinc-950')}>
                        {company.name}
                      </p>
                      <p className={cn('truncate text-xs', state.active || state.selected ? 'text-white/80' : 'text-zinc-500')}>
                        {company.address} • {company.tel} • {company.bookingCount} การจอง
                      </p>
                    </div>
                  )}
                  onSelect={(company) => setCreateCompanyId(company.id)}
                  disabled={companies.length === 0}
                />
              </Field>
            </div>
            <div>

              <Field label="ช่วงเวลาสัมภาษณ์">
                <Select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                  {bookingSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                type="button"
                className="w-full mt-8"
                onClick={() => void submitBooking()}
                disabled={submitting || !createUserId || !createCompanyId || !selectedDate}
              >
                {submitting ? 'กำลังสร้าง...' : 'ยืนยันการจอง'}
              </Button>
              {bookableUsers.length === 0 ? (
                <p className="text-sm text-amber-700">
                  ยังไม่มีบัญชีผู้ใช้ปกติให้เลือก ระบบจะไม่แสดงบัญชีแอดมินในตัวเลือกนี้
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {mode === 'edit' && selectedInterview ? (
          <div className="space-y-5">
            <Panel className="space-y-3 p-5">
              <div>
                <p className="text-sm font-semibold text-ink-900">{selectedInterview.company.name}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {userDisplayName(selectedInterview.user)} • {selectedInterview.user.email}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">วันที่ปัจจุบัน</p>
                <p className="mt-2 text-sm text-ink-900">{formatDate(selectedInterview.date)}</p>
              </div>
            </Panel>
            <Field label="ช่วงเวลาใหม่">
              <Select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                {bookingSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              type="button"
              className="w-full"
              onClick={() => void submitBooking()}
              disabled={submitting || !selectedDate}
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        ) : null}
      </SideSheet>
    </section>
  );
}

function CompaniesSection({
  token,
  companies,
  onReload,
}: {
  token: string;
  companies: Company[];
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_COMPANY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return companies;
    }

    return companies.filter((company) =>
      [company.name, company.address, company.tel]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [companies, query]);

  const openCreate = () => {
    setEditingCompanyId(null);
    setForm(EMPTY_COMPANY_FORM);
    setMode('create');
  };

  const openEdit = (company: Company) => {
    setEditingCompanyId(company.id);
    setForm({
      name: company.name,
      address: company.address,
      website: company.website ?? '',
      description: company.description,
      tel: company.tel,
    });
    setMode('edit');
  };

  const closeSheet = () => {
    setMode(null);
    setEditingCompanyId(null);
  };

  const submitCompany = async () => {
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        website: form.website.trim() || undefined,
        description: form.description.trim(),
        tel: form.tel.trim(),
      };

      if (mode === 'edit' && editingCompanyId) {
        await updateCompany(token, editingCompanyId, payload);
        toast.success('อัปเดตบริษัทเรียบร้อยแล้ว');
      } else {
        await createCompany(token, payload);
        toast.success('เพิ่มบริษัทใหม่เรียบร้อยแล้ว');
      }

      closeSheet();
      setForm(EMPTY_COMPANY_FORM);
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกบริษัทได้');
    } finally {
      setSubmitting(false);
    }
  };

  const removeCompanyById = async (companyId: string) => {
    setBusyId(companyId);

    try {
      await deleteCompany(token, companyId);
      toast.success('ลบบริษัทและการจองที่เกี่ยวข้องเรียบร้อยแล้ว');
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถลบบริษัทได้');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">Companies</p>
          <h2 className="font-display text-3xl text-ink-900">ดูแลข้อมูลบริษัท</h2>
          <p className="max-w-3xl text-sm leading-6 text-ink-600">
            แยกการสร้างและแก้ไขออกจากรายการหลัก เพื่อให้ตรวจสอบผลกระทบต่อการจองได้ชัดเจนขึ้น
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add company
        </Button>
      </div>
      <Panel className="space-y-4 p-4 sm:p-5">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาจากชื่อบริษัท ที่อยู่ หรือเบอร์โทร"
        />
      </Panel>

      {filteredCompanies.length === 0 ? (
        <EmptyState
          title="ไม่พบบริษัท"
          description="ลองใช้คำค้นหาอื่น หรือเพิ่มบริษัทใหม่จากปุ่มด้านบน"
        />
      ) : (
        <DataTable columns={['บริษัท', 'ที่อยู่', 'ติดต่อ', 'เว็บไซต์', 'การจอง', 'จัดการ']}>
          {filteredCompanies.map((company) => (
            <tr key={company.id} className="align-top">
              <td className="px-4 py-4">
                <p className="font-medium text-ink-900">{company.name}</p>
                <p className="mt-1 text-xs text-ink-500">{company.description}</p>
              </td>
              <td className="px-4 py-4 text-sm text-ink-700">{company.address}</td>
              <td className="px-4 py-4 text-sm text-ink-700">{company.tel}</td>
              <td className="px-4 py-4 text-sm text-ink-700">{company.website ? 'มี' : 'ไม่มี'}</td>
              <td className="px-4 py-4 text-sm text-ink-700">{company.bookingCount}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => openEdit(company)}>
                    Edit
                  </Button>
                  <AnchorButton href={`/companies/${company.id}`} variant="secondary">
                    View page
                  </AnchorButton>
                  <DeleteButton
                    onConfirm={() => void removeCompanyById(company.id)}
                    disabled={busyId === company.id}
                    description="ลบบริษัทนี้และการจองทั้งหมดที่ผูกอยู่หรือไม่?"
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <SideSheet
        open={mode !== null}
        onClose={closeSheet}
        title={mode === 'edit' ? 'Edit company' : 'Create company'}
        description={
          mode === 'edit'
            ? 'แก้ไขรายละเอียดบริษัทโดยไม่ต้องเลื่อนหาฟอร์มในหน้าเดิม'
            : 'เพิ่มบริษัทใหม่ให้พร้อมสำหรับการจองทันที'
        }
      >
        <div className="space-y-5">
            <div>
            <Field label="ชื่อบริษัท">
              <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="บริษัทตัวอย่าง จำกัด"
              />
            </Field>
            </div>
            <div>
            <Field label="ที่อยู่">
              <Input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="กรุงเทพมหานคร"
              />
            </Field>
            </div>
            <div>
            <Field label="เว็บไซต์">
              <Input
              value={form.website}
              onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              placeholder="https://example.com"
              />
            </Field>
            </div>
            <div>
            <Field label="เบอร์โทร">
              <Input
              value={form.tel}
              onChange={(event) => setForm((current) => ({ ...current, tel: event.target.value }))}
              placeholder="021234567"
              />
            </Field>
            </div>
            <div>
            <Field label="รายละเอียด">
              <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="เล่าภาพรวมบริษัทให้ผู้สมัครเข้าใจอย่างรวดเร็ว"
              />
            </Field>
            </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => void submitCompany()}
            disabled={
              submitting ||
              !form.name.trim() ||
              !form.address.trim() ||
              !form.description.trim() ||
              !form.tel.trim()
            }
          >
            {submitting ? 'กำลังบันทึก...' : mode === 'edit' ? 'บันทึกการแก้ไข' : 'สร้างบริษัท'}
          </Button>
        </div>
      </SideSheet>
    </section>
  );
}

function UsersSection({
  currentUser,
  token,
  interviews,
  users,
  onReload,
  onRefreshSession,
}: {
  currentUser: User | null;
  token: string;
  interviews: Interview[];
  users: User[];
  onReload: () => Promise<void>;
  onRefreshSession: () => Promise<User | null>;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<Role>('user');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedUser = users.find((user) => user.id === drawerUserId) ?? null;
  const selectedUserBookings = useMemo(
    () => interviews.filter((interview) => interview.user.id === drawerUserId),
    [drawerUserId, interviews],
  );

  useEffect(() => {
    if (selectedUser) {
      setRoleDraft(selectedUser.role);
    }
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [user.name, user.email, user.telephone].join(' ').toLowerCase().includes(term);
    });
  }, [query, roleFilter, users]);

  const openUser = (userId: string) => {
    setDrawerUserId(userId);
  };

  const closeSheet = () => {
    setDrawerUserId(null);
  };

  const submitRoleChange = async () => {
    if (!selectedUser) {
      return;
    }

    setSubmitting(true);

    try {
      await updateUser(token, selectedUser.id, { role: roleDraft });
      toast.success('อัปเดตบทบาทผู้ใช้เรียบร้อยแล้ว');
      await onReload();

      if (currentUser?.id === selectedUser.id) {
        await onRefreshSession();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถอัปเดตบทบาทได้');
    } finally {
      setSubmitting(false);
    }
  };

  const removeUserById = async (userId: string) => {
    setBusyId(userId);

    try {
      await deleteUser(token, userId);
      toast.success('ลบผู้ใช้และการจองที่เกี่ยวข้องเรียบร้อยแล้ว');
      if (drawerUserId === userId) {
        closeSheet();
      }
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Users</p>
        <h2 className="font-display text-3xl text-ink-900">จัดการผู้ใช้และสิทธิ์</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-600">
          ตรวจสอบบทบาท ประวัติการจอง และลบบัญชีที่ไม่ต้องการจากพื้นที่เดียว
        </p>
      </div>
      <Panel className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(200px,1fr)]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาจากชื่อ อีเมล หรือเบอร์โทร"
          />
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | Role)}>
            <option value="all">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="user">ผู้ใช้</option>
          </Select>
        </div>
      </Panel>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="ไม่พบผู้ใช้"
          description="ลองใช้คำค้นหาใหม่หรือล้างตัวกรองบทบาท"
        />
      ) : (
        <DataTable columns={['ผู้ใช้', 'ติดต่อ', 'บทบาท', 'สร้างเมื่อ', 'การจอง', 'จัดการ']}>
          {filteredUsers.map((user) => {
            const isSelf = currentUser?.id === user.id;
            return (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink-900">{userDisplayName(user)}</p>
                  {isSelf ? <p className="mt-1 text-xs text-amber-700">บัญชีที่กำลังใช้งานอยู่</p> : null}
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-ink-700">{user.email}</p>
                  <p className="mt-1 text-xs text-ink-500">{user.telephone || 'ไม่มีข้อมูล'}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={user.role === 'admin' ? 'warm' : 'neutral'}>{formatRoleLabel(user.role)}</Badge>
                </td>
                <td className="px-4 py-4 text-sm text-ink-700">
                  {user.createdAt ? formatDate(user.createdAt) : 'ไม่มีข้อมูล'}
                </td>
                <td className="px-4 py-4 text-sm text-ink-700">{user.bookingCount}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => openUser(user.id)}>
                      Change role
                    </Button>
                    <Button type="button" variant="outline" onClick={() => openUser(user.id)}>
                      View bookings
                    </Button>
                    <DeleteButton
                      onConfirm={() => void removeUserById(user.id)}
                      disabled={isSelf || busyId === user.id}
                      description={isSelf ? 'ไม่สามารถลบบัญชีที่กำลังใช้งาน' : 'ลบผู้ใช้และการจองทั้งหมดหรือไม่?'}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      <SideSheet
        open={selectedUser !== null}
        onClose={closeSheet}
        title="User detail"
        description="ดูข้อมูลบัญชีและจัดการบทบาทโดยไม่ออกจากหน้ารายการ"
      >
        {selectedUser ? (
          <div className="space-y-6">
            <Panel className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink-900">{userDisplayName(selectedUser)}</p>
                  <p className="text-sm text-ink-500">{selectedUser.email}</p>
                </div>
                <Badge tone={selectedUser.role === 'admin' ? 'warm' : 'neutral'}>
                  {formatRoleLabel(selectedUser.role)}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-500">เบอร์โทร</p>
                  <p className="mt-2 text-sm text-ink-900">{selectedUser.telephone || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-500">การจองทั้งหมด</p>
                  <p className="mt-2 text-sm text-ink-900">{selectedUser.bookingCount} รายการ</p>
                </div>
              </div>
            </Panel>
            <Panel className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink-900">Change role</p>
                  <p className="text-sm text-ink-500">v1 รองรับการปรับบทบาทระหว่างผู้ใช้และแอดมิน</p>
                </div>
              </div>
              <Field
                label="บทบาท"
                hint={currentUser?.id === selectedUser.id ? 'ไม่แนะนำให้แก้สิทธิ์ของบัญชีที่กำลังใช้งาน' : undefined}
              >
                <Select
                  value={roleDraft}
                  onChange={(event) => setRoleDraft(event.target.value as Role)}
                  disabled={currentUser?.id === selectedUser.id}
                >
                  <option value="user">ผู้ใช้</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </Select>
              </Field>
              <Button
                type="button"
                className="w-full"
                onClick={() => void submitRoleChange()}
                disabled={
                  submitting ||
                  currentUser?.id === selectedUser.id ||
                  roleDraft === selectedUser.role
                }
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกบทบาทใหม่'}
              </Button>
            </Panel>

            {selectedUserBookings.length === 0 ? (
              <EmptyState
                title="ผู้ใช้นี้ยังไม่มีการจอง"
                description="เมื่อผู้ใช้นี้เริ่มจอง รายการจะปรากฏในส่วนนี้ทันที"
              />
            ) : (
              <DataTable columns={['บริษัท', 'วันสัมภาษณ์', 'สร้างเมื่อ']}>
                {selectedUserBookings.map((interview) => (
                  <tr key={interview.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink-900">{interview.company.name}</p>
                      <p className="mt-1 text-xs text-ink-500">{interview.company.address}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-ink-700">{formatDate(interview.date)}</td>
                    <td className="px-4 py-4 text-sm text-ink-700">
                      {interview.createdAt ? formatDate(interview.createdAt) : 'ไม่มีข้อมูล'}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        ) : null}
      </SideSheet>
    </section>
  );
}

export function AdminWorkspace() {
  const { refresh, token, user } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = parseSection(searchParams.get('section'));

  const { data, error, loading, reload } = useAsync(async () => {
    if (!token) {
      return null;
    }

    const [companies, interviews, users, bookingSlots] = await Promise.all([
      getCompanies(token),
      getInterviews(token),
      getUsers(token),
      getInterviewSlots(token),
    ]);

    return { companies, interviews, users, bookingSlots };
  }, [token]);

  const companies = data?.companies ?? EMPTY_COMPANIES;
  const interviews = data?.interviews ?? EMPTY_INTERVIEWS;
  const users = data?.users ?? EMPTY_USERS;
  const bookingSlots = data?.bookingSlots ?? EMPTY_SLOTS;

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const changeSection = (section: AdminSectionKey) => {
    router.replace(buildSectionHref(pathname, new URLSearchParams(searchParams.toString()), section), {
      scroll: false,
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <Spinner label="กำลังโหลด Admin Workspace..." />
        </Panel>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Panel className="p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            โหลดข้อมูลผู้ดูแลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Admin Workspace</p>
            <h1 className="font-display text-4xl text-ink-900">ศูนย์ควบคุมการจอง บริษัท และผู้ใช้</h1>
            <p className="max-w-3xl text-sm leading-6 text-ink-600">
              ใช้งานแบบตารางสำหรับงานประจำวัน และเปิดรายละเอียดเฉพาะตอนที่ต้องแก้ไขจริง
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge tone="warm">{formatRoleLabel(user?.role ?? 'admin')}</Badge>
            <AnchorButton href="/companies" variant="secondary">
              ดูหน้าบริษัทสาธารณะ
            </AnchorButton>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Bookings" value={interviews.length.toString()} note="รายการจองทั้งหมดในระบบ" />
          <StatCard label="Companies" value={companies.length.toString()} note="บริษัทที่พร้อมให้จอง" />
          <StatCard label="Users" value={users.length.toString()} note="บัญชีที่ผู้ดูแลจัดการได้" />
          <StatCard label="Slots" value={bookingSlots.length.toString()} note="ช่วงเวลาที่เซิร์ฟเวอร์อนุญาต" />
        </div>
      </div>

      <SectionTabs activeSection={activeSection} onChange={changeSection} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === 'bookings' ? (
          <BookingsSection
            token={token}
            bookingSlots={bookingSlots}
            companies={companies}
            interviews={interviews}
            users={users}
            onReload={reload}
          />
        ) : null}

        {activeSection === 'companies' ? (
          <CompaniesSection token={token} companies={companies} onReload={reload} />
        ) : null}

        {activeSection === 'users' ? (
          <UsersSection
            currentUser={user}
            token={token}
            interviews={interviews}
            users={users}
            onReload={reload}
            onRefreshSession={refresh}
          />
        ) : null}
      </div>
    </div>
  );
}
