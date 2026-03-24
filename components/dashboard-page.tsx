'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Alert } from '@/components/alert';
import { DeleteButton } from '@/components/delete-button';
import { SearchSelectField } from '@/components/search-select-picker';
import {
  AnchorButton,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Panel,
  Select,
  Spinner,
  StatCard,
} from '@/components/shadcn-ui';
import {
  createBulkInterviews,
  createInterview,
  deleteInterview,
  getCompanies,
  getInterviews,
  getInterviewSlots,
  updateInterview,
} from '@/lib/api';
import { formatDate, formatDateTime, interviewOptions } from '@/lib/date';
import type { BookingSlot, Company, Interview } from '@/lib/types';
import { useAsync } from '@/hooks/use-async';
import { cn, interviewCompanyName } from '@/lib/utils';

type DashboardSectionKey = 'overview' | 'new' | 'bookings';
type BookingMode = 'single' | 'multi';
type NoticeTone = 'success' | 'error' | 'info';

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_INTERVIEWS: Interview[] = [];
const EMPTY_SLOTS: BookingSlot[] = [];
const SECTION_OPTIONS: Array<{ key: DashboardSectionKey; label: string; note: string }> = [
  { key: 'overview', label: 'Overview', note: 'ภาพรวมสิทธิ์และรายการที่ต้องสนใจ' },
  { key: 'new', label: 'New Booking', note: 'จองใหม่แบบง่ายหรือหลายบริษัท' },
  { key: 'bookings', label: 'My Bookings', note: 'จัดการ เปลี่ยนวัน หรือยกเลิก' },
];

function parseSection(value: string | null): DashboardSectionKey {
  return value === 'new' || value === 'bookings' ? value : 'overview';
}

function parseBookingMode(value: string | null): BookingMode {
  return value === 'multi' ? 'multi' : 'single';
}

function buildDashboardHref(
  pathname: string,
  searchParams: URLSearchParams,
  updates: {
    section?: DashboardSectionKey;
    mode?: BookingMode;
  },
) {
  const next = new URLSearchParams(searchParams.toString());

  if (updates.section) {
    next.set('section', updates.section);
  }

  if (updates.mode) {
    next.set('mode', updates.mode);
  }

  return `${pathname}?${next.toString()}`;
}

function findFirstSlot(slots: BookingSlot[]) {
  return slots[0]?.value ?? '';
}

function roleLabel(role: 'user' | 'admin') {
  return role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้';
}

function companySearchText(company: Company) {
  return [company.name, company.address, company.tel, company.description].join(' ');
}

function bookingStatusText({
  isAdmin,
  remainingSlotsCount,
  interviews,
  upcomingInterview,
}: {
  isAdmin: boolean;
  remainingSlotsCount: number;
  interviews: Interview[];
  upcomingInterview: Interview | null;
}) {
  if (isAdmin) {
    return 'บัญชีผู้ดูแล';
  }

  if (interviews.length === 0) {
    return 'พร้อมเริ่มจอง';
  }

  if (remainingSlotsCount === 0) {
    return 'ใช้สิทธิ์ครบแล้ว';
  }

  if (upcomingInterview) {
    return 'มีรอบถัดไปแล้ว';
  }

  return 'ยังจองเพิ่มได้';
}

function WorkspaceTabs({
  activeSection,
  onChange,
}: {
  activeSection: DashboardSectionKey;
  onChange: (section: DashboardSectionKey) => void;
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

function UserSheet({
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
      <aside className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-white lg:inset-y-0 lg:right-0 lg:left-auto lg:w-full lg:max-w-2xl lg:border-l lg:border-zinc-200">
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">User Dashboard</p>
              <h2 className="mt-2 font-display text-2xl text-ink-900">{title}</h2>
              {description ? <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p> : null}
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
        <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </aside>
    </div>
  );
}

function OverviewSection({
  isAdmin,
  interviews,
  nextUpcomingInterview,
  remainingSlotsLabel,
  remainingSlotsCount,
  statusText,
  onOpenNewSingle,
  onOpenNewMulti,
  onOpenBookings,
}: {
  isAdmin: boolean;
  interviews: Interview[];
  nextUpcomingInterview: Interview | null;
  remainingSlotsLabel: string;
  remainingSlotsCount: number;
  statusText: string;
  onOpenNewSingle: () => void;
  onOpenNewMulti: () => void;
  onOpenBookings: () => void;
}) {
  const attention = isAdmin
    ? {
        title: 'บัญชีนี้เป็นผู้ดูแลระบบ',
        description: 'แดชบอร์ดนี้ออกแบบมาสำหรับผู้ใช้ทั่วไป หากต้องจัดการทั้งระบบให้ไปที่ Admin Workspace',
      }
    : interviews.length === 0
      ? {
          title: 'ยังไม่มีการจอง',
          description: 'เริ่มจากการเลือกบริษัทแรกของคุณ แล้วค่อยกลับมาจัดการรอบสัมภาษณ์จากส่วน My Bookings',
        }
      : remainingSlotsCount === 0
        ? {
            title: 'คุณใช้สิทธิ์ครบแล้ว',
            description: 'ตอนนี้ยังเพิ่มบริษัทใหม่ไม่ได้ แต่ยังสามารถเปลี่ยนวันหรือยกเลิกรายการเดิมได้',
          }
        : nextUpcomingInterview
          ? {
              title: `รอบถัดไปกับ ${interviewCompanyName(nextUpcomingInterview)}`,
              description: `เตรียมตัวสำหรับ ${formatDateTime(nextUpcomingInterview.date)} และใช้สิทธิ์ที่เหลืออย่างระมัดระวัง`,
            }
          : {
              title: 'ยังจองเพิ่มได้',
              description: 'คุณยังมีสิทธิ์เหลือและสามารถเพิ่มบริษัทใหม่หรือปรับแผนจากรายการเดิมได้',
            };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Overview</p>
        <h2 className="font-display text-3xl text-ink-900">ภาพรวมการจองของคุณ</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-600">
          โฟกัสที่สิ่งที่ต้องทำต่อไปก่อน แล้วค่อยลงมือจองใหม่หรือจัดการรอบที่มีอยู่
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="การจองทั้งหมด" value={interviews.length.toString()} note="รายการที่ระบบกำลังดูแลให้คุณ" />
        <StatCard label="สิทธิ์คงเหลือ" value={remainingSlotsLabel} note="บัญชีผู้ใช้ทั่วไปจองได้สูงสุด 3 ครั้ง" />
        <StatCard
          label="รอบถัดไป"
          value={nextUpcomingInterview ? formatDate(nextUpcomingInterview.date) : 'ยังไม่มี'}
          note={nextUpcomingInterview ? interviewCompanyName(nextUpcomingInterview) : 'สร้างการจองใหม่เพื่อเริ่มต้น'}
        />
        <StatCard label="สถานะ" value={statusText} note={isAdmin ? 'มีทางลัดไปยัง Admin Workspace' : 'สรุปจากสิทธิ์และรายการปัจจุบัน'} />
      </div>

      <Panel className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="eyebrow">สิ่งที่ควรทำต่อ</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink-900">{attention.title}</h3>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-ink-600">{attention.description}</p>
          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <AnchorButton href="/admin">ไปยัง Admin Workspace</AnchorButton>
            ) : (
              <>
                <Button type="button" onClick={onOpenNewSingle}>
                  เริ่มจองใหม่
                </Button>
                <Button type="button" variant="outline" onClick={onOpenBookings}>
                  จัดการการจองของฉัน
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={onOpenNewSingle}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left transition-colors hover:border-zinc-300"
            >
              <p className="text-sm font-semibold text-zinc-900">Single booking</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">เลือกบริษัทเดียวแบบรวดเร็ว พร้อมดูสรุปก่อนยืนยัน</p>
            </button>
            <button
              type="button"
              onClick={onOpenNewMulti}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left transition-colors hover:border-zinc-300"
            >
              <p className="text-sm font-semibold text-zinc-900">Multi-booking</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">ใช้โหมดขั้นสูงเพื่อเลือกหลายบริษัทภายใต้สิทธิ์ที่เหลือ</p>
            </button>
            <button
              type="button"
              onClick={onOpenBookings}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left transition-colors hover:border-zinc-300"
            >
              <p className="text-sm font-semibold text-zinc-900">My bookings</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">เปลี่ยนวัน ยกเลิก หรือเปิดหน้าบริษัทจากรายการปัจจุบัน</p>
            </button>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function NewBookingSection({
  availableCompanies,
  bookedCount,
  bookingMode,
  bookingSlots,
  isAdmin,
  maxSelectableCount,
  multiCompanyIds,
  multiNotice,
  multiQuery,
  multiSubmitting,
  onChangeMode,
  onMultiQueryChange,
  onOpenAdmin,
  onSubmitMulti,
  onSubmitSingle,
  onToggleCompany,
  remainingSlotsLabel,
  selectedSingleCompanyId,
  singleDate,
  singleNotice,
  singleSubmitting,
  onSelectSingleCompany,
  onSingleDateChange,
  onBulkDateChange,
  bulkDate,
}: {
  availableCompanies: Company[];
  bookedCount: number;
  bookingMode: BookingMode;
  bookingSlots: BookingSlot[];
  isAdmin: boolean;
  maxSelectableCount: number;
  multiCompanyIds: string[];
  multiNotice: { text: string; tone: NoticeTone } | null;
  multiQuery: string;
  multiSubmitting: boolean;
  onChangeMode: (mode: BookingMode) => void;
  onMultiQueryChange: (value: string) => void;
  onOpenAdmin: () => void;
  onSubmitMulti: () => void;
  onSubmitSingle: () => void;
  onToggleCompany: (companyId: string, checked: boolean) => void;
  remainingSlotsLabel: string;
  selectedSingleCompanyId: string;
  singleDate: string;
  singleNotice: { text: string; tone: NoticeTone } | null;
  singleSubmitting: boolean;
  onSelectSingleCompany: (companyId: string) => void;
  onSingleDateChange: (value: string) => void;
  onBulkDateChange: (value: string) => void;
  bulkDate: string;
}) {
  const filteredCompanies = useMemo(() => {
    const term = multiQuery.trim().toLowerCase();
    if (!term) {
      return availableCompanies;
    }

    return availableCompanies.filter((company) => companySearchText(company).toLowerCase().includes(term));
  }, [availableCompanies, multiQuery]);

  const selectedSingleCompany = availableCompanies.find((company) => company.id === selectedSingleCompanyId) ?? null;
  const bookingLocked = !isAdmin && maxSelectableCount === 0;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">New Booking</p>
        <h2 className="font-display text-3xl text-ink-900">สร้างการจองใหม่อย่างมีบริบท</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-600">
          เริ่มจากการจองแบบง่ายก่อน แล้วค่อยใช้โหมดหลายบริษัทเมื่อคุณต้องการวางแผนหลายทางเลือกพร้อมกัน
        </p>
      </div>

      <Panel className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Booking mode</p>
            <p className="mt-1 text-sm text-zinc-500">เลือกโหมดที่เหมาะกับงานตอนนี้</p>
          </div>
          <Badge tone="accent">
            {isAdmin ? 'Admin view' : `เหลือ ${remainingSlotsLabel} สิทธิ์`}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChangeMode('single')}
            className={cn(
              'rounded-2xl border px-4 py-4 text-left transition-colors',
              bookingMode === 'single'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300',
            )}
          >
            <p className={cn('text-sm font-semibold', bookingMode === 'single' ? 'text-white' : 'text-zinc-900')}>
              Single booking
            </p>
            <p className={cn('mt-1 text-xs leading-5', bookingMode === 'single' ? 'text-white/80' : 'text-zinc-500')}>
              เลือกหนึ่งบริษัทผ่านตัวค้นหาและยืนยันอย่างรวดเร็ว
            </p>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('multi')}
            className={cn(
              'rounded-2xl border px-4 py-4 text-left transition-colors',
              bookingMode === 'multi'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300',
            )}
          >
            <p className={cn('text-sm font-semibold', bookingMode === 'multi' ? 'text-white' : 'text-zinc-900')}>
              Multi-booking
            </p>
            <p className={cn('mt-1 text-xs leading-5', bookingMode === 'multi' ? 'text-white/80' : 'text-zinc-500')}>
              โหมดขั้นสูงสำหรับเลือกหลายบริษัทในครั้งเดียว
            </p>
          </button>
        </div>
      </Panel>

      {isAdmin ? (
        <Panel className="space-y-4 p-6">
          <h3 className="text-xl font-semibold text-ink-900">บัญชีผู้ดูแลไม่ใช้ขั้นตอนจองแบบผู้ใช้</h3>
          <p className="text-sm leading-6 text-ink-600">
            หากต้องสร้างการจองแทนผู้ใช้อื่นหรือจัดการทุกบริษัท ให้ทำจาก Admin Workspace เพื่อใช้ flow ที่เหมาะกับงานผู้ดูแล
          </p>
          <div className="flex flex-wrap gap-3">
            <AnchorButton href="/admin">เปิด Admin Workspace</AnchorButton>
            <Button type="button" variant="outline" onClick={onOpenAdmin}>
              ไปยังส่วนจัดการการจอง
            </Button>
          </div>
        </Panel>
      ) : bookingMode === 'single' ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="eyebrow">Simple Flow</p>
              <h3 className="text-2xl font-semibold text-ink-900">จองทีละบริษัท</h3>
              <p className="text-sm leading-6 text-ink-600">
                เหมาะเมื่อคุณรู้แล้วว่าจะเริ่มที่ไหน เลือกบริษัทหนึ่งแห่งและเวลาที่ต้องการก่อนยืนยัน
              </p>
            </div>

            {singleNotice ? <Alert message={singleNotice.text} tone={singleNotice.tone} /> : null}

            {bookingLocked ? (
              <EmptyState
                title="ใช้สิทธิ์ครบแล้ว"
                description="คุณยังสร้างการจองใหม่ไม่ได้ ลองไปที่ My Bookings เพื่อเปลี่ยนวันหรือยกเลิกรายการเดิม"
              />
            ) : availableCompanies.length === 0 ? (
              <EmptyState
                title="ไม่มีบริษัทที่จองได้เพิ่ม"
                description="คุณอาจจองครบทุกบริษัทที่สนใจแล้ว หรือข้อมูลบริษัทยังไม่พร้อม"
              />
            ) : (
              <>
                <div>
                  <Field label="บริษัท">
                    <SearchSelectField
                      title="เลือกบริษัทสำหรับการจอง"
                      description="ค้นหาจากชื่อบริษัท ที่อยู่ หรือเบอร์โทร"
                      items={availableCompanies}
                      selectedId={selectedSingleCompanyId}
                      placeholder="ค้นหาและเลือกบริษัท"
                      searchPlaceholder="ค้นหาจากชื่อบริษัท ที่อยู่ หรือเบอร์โทร"
                      emptyTitle="ไม่พบบริษัทที่ตรงคำค้นหา"
                      emptyDescription="ลองค้นหาด้วยชื่อบริษัทหรือข้อมูลติดต่ออื่น"
                      getId={(company) => company.id}
                      getSearchText={(company) => companySearchText(company)}
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
                      onSelect={(company) => onSelectSingleCompany(company.id)}
                    />
                  </Field>
                </div>
                <div>
                  <Field label="ช่วงเวลาสัมภาษณ์">
                    <Select value={singleDate} onChange={(event) => onSingleDateChange(event.target.value)}>
                      {bookingSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </>
            )}
          </Panel>

          <Panel className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="eyebrow">Booking Summary</p>
              <h3 className="text-2xl font-semibold text-ink-900">ตรวจสอบก่อนยืนยัน</h3>
            </div>

            {selectedSingleCompany ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">{selectedSingleCompany.name}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{selectedSingleCompany.address}</p>
                  <p className="mt-2 text-xs text-zinc-500">{selectedSingleCompany.tel} • {selectedSingleCompany.bookingCount} การจองในระบบ</p>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">เวลาที่เลือก</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-900">
                    {bookingSlots.find((slot) => slot.value === singleDate)?.label ?? 'ยังไม่เลือกเวลา'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                title="เลือกบริษัทก่อน"
                description="เมื่อคุณเลือกบริษัท รายละเอียดสรุปจะปรากฏที่นี่ทันที"
              />
            )}

            <Button
              type="button"
              onClick={onSubmitSingle}
              disabled={singleSubmitting || !selectedSingleCompany || !singleDate || bookingLocked}
              className="w-full"
            >
              {singleSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันการจองบริษัทนี้'}
            </Button>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="eyebrow">Advanced Flow</p>
              <h3 className="text-2xl font-semibold text-ink-900">จองหลายบริษัท</h3>
              <p className="text-sm leading-6 text-ink-600">
                ใช้โหมดนี้เมื่อคุณต้องการล็อกหลายทางเลือกในช่วงเวลาเดียวกัน โดยระบบจะนับตามสิทธิ์ที่เหลือจริง
              </p>
            </div>

            {multiNotice ? <Alert message={multiNotice.text} tone={multiNotice.tone} /> : null}

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <Input
                value={multiQuery}
                onChange={(event) => onMultiQueryChange(event.target.value)}
                placeholder="ค้นหาบริษัทจากชื่อ ที่อยู่ หรือเบอร์โทร"
              />
              <Select value={bulkDate} onChange={(event) => onBulkDateChange(event.target.value)}>
                {bookingSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </Select>
            </div>

            {bookingLocked ? (
              <EmptyState
                title="ไม่มีสิทธิ์เหลือสำหรับการจองใหม่"
                description="หากต้องการใช้โหมดหลายบริษัท ให้ยกเลิกรายการเดิมหรือรอรอบใหม่"
              />
            ) : filteredCompanies.length === 0 ? (
              <EmptyState
                title="ไม่พบบริษัทที่ตรงคำค้นหา"
                description="ลองค้นหาด้วยคำอื่น หรือกลับไปใช้โหมด Single booking"
              />
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {filteredCompanies.map((company) => (
                  <Checkbox
                    key={company.id}
                    label={company.name}
                    description={`${company.address} • ${company.tel} • ${company.bookingCount} การจอง`}
                    checked={multiCompanyIds.includes(company.id)}
                    onChange={(checked) => onToggleCompany(company.id, checked)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Selection</p>
                <h3 className="text-2xl font-semibold text-ink-900">บริษัทที่เลือก</h3>
              </div>
              <Badge tone="accent">{multiCompanyIds.length}/{maxSelectableCount}</Badge>
            </div>

            {multiCompanyIds.length === 0 ? (
              <EmptyState
                title="ยังไม่ได้เลือกบริษัท"
                description="เลือกบริษัทจากรายการด้านซ้าย แล้วสรุปจะอัปเดตทันที"
              />
            ) : (
              <div className="space-y-3">
                {availableCompanies
                  .filter((company) => multiCompanyIds.includes(company.id))
                  .map((company) => (
                    <div key={company.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">{company.name}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{company.address}</p>
                    </div>
                  ))}
              </div>
            )}

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">ช่วงเวลาที่เลือก</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {bookingSlots.find((slot) => slot.value === bulkDate)?.label ?? 'ยังไม่เลือกเวลา'}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                คุณจองไปแล้ว {bookedCount} รายการ และเหลือสิทธิ์ {remainingSlotsLabel}
              </p>
            </div>

            <Button
              type="button"
              onClick={onSubmitMulti}
              disabled={multiSubmitting || multiCompanyIds.length === 0 || bookingLocked}
              className="w-full"
            >
              {multiSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันการจองหลายบริษัท'}
            </Button>
          </Panel>
        </div>
      )}
    </section>
  );
}

function MyBookingsSection({
  bookingsNotice,
  deleteBusyId,
  interviews,
  isAdmin,
  onOpenReschedule,
  onOpenOverview,
  onDeleteInterview,
}: {
  bookingsNotice: { text: string; tone: NoticeTone } | null;
  deleteBusyId: string | null;
  interviews: Interview[];
  isAdmin: boolean;
  onOpenReschedule: (interview: Interview) => void;
  onOpenOverview: () => void;
  onDeleteInterview: (interviewId: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">My Bookings</p>
        <h2 className="font-display text-3xl text-ink-900">
          {isAdmin ? 'รายการที่เข้าถึงได้จากบัญชีนี้' : 'จัดการการจองของฉัน'}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-600">
          เปลี่ยนวัน ยกเลิกรายการ หรือเปิดหน้าบริษัทเดิมโดยไม่ต้องกลับไปค้นหาใหม่
        </p>
      </div>

      {bookingsNotice ? <Alert message={bookingsNotice.text} tone={bookingsNotice.tone} /> : null}

      {interviews.length === 0 ? (
        <EmptyState
          title="ยังไม่มีการจอง"
          description="เริ่มต้นจากส่วน New Booking แล้วกลับมาจัดการรายการของคุณที่นี่"
          action={
            <Button type="button" onClick={onOpenOverview}>
              ไปที่ภาพรวม
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Panel key={interview.id} className="space-y-4 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-ink-900">{interviewCompanyName(interview)}</p>
                    <Badge tone="neutral">{formatDate(interview.date)}</Badge>
                  </div>
                  <p className="text-sm text-ink-500">{interview.company.address}</p>
                  <p className="text-xs text-ink-500">
                    สร้างเมื่อ {interview.createdAt ? formatDateTime(interview.createdAt) : 'ไม่มีข้อมูล'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenReschedule(interview)}>
                    Reschedule
                  </Button>
                  <AnchorButton href={`/companies/${interview.company.id}`} variant="secondary">
                    View company
                  </AnchorButton>
                  <DeleteButton
                    onConfirm={() => onDeleteInterview(interview.id)}
                    disabled={deleteBusyId === interview.id}
                    description="ยกเลิกรายการจองนี้หรือไม่?"
                    triggerText="Cancel"
                  />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { user, token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = parseSection(searchParams.get('section'));
  const bookingMode = parseBookingMode(searchParams.get('mode'));
  const [singleCompanyId, setSingleCompanyId] = useState('');
  const [singleDate, setSingleDate] = useState<string>(interviewOptions[0].value);
  const [bulkDate, setBulkDate] = useState<string>(interviewOptions[0].value);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companyQuery, setCompanyQuery] = useState('');
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [editDate, setEditDate] = useState<string>(interviewOptions[0].value);
  const [singleNotice, setSingleNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const [multiNotice, setMultiNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const [bookingsNotice, setBookingsNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const [sheetNotice, setSheetNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [multiSubmitting, setMultiSubmitting] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    if (!token) return null;

    const [companies, interviews, bookingSlots] = await Promise.all([
      getCompanies(token),
      getInterviews(token),
      getInterviewSlots(token).catch(() => [...interviewOptions]),
    ]);

    return { companies, interviews, bookingSlots };
  }, [token]);

  const companies = data?.companies ?? EMPTY_COMPANIES;
  const interviews = data?.interviews ?? EMPTY_INTERVIEWS;
  const bookingSlots = data?.bookingSlots ?? EMPTY_SLOTS;
  const sortedInterviews = useMemo(
    () => [...interviews].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    [interviews],
  );
  const bookedCompanyIds = useMemo(
    () => new Set(interviews.map((interview) => interview.company.id)),
    [interviews],
  );
  const availableCompanies = useMemo(
    () => companies.filter((company) => !bookedCompanyIds.has(company.id)),
    [bookedCompanyIds, companies],
  );

  const now = Date.now();
  const nextUpcomingInterview = sortedInterviews.find((interview) => new Date(interview.date).getTime() >= now) ?? null;
  const isAdmin = user?.role === 'admin';
  const bookedCount = interviews.length;
  const remainingSlotsCount = isAdmin ? 0 : Math.max(0, 3 - bookedCount);
  const remainingSlotsLabel = isAdmin ? 'ดูที่ Admin' : remainingSlotsCount.toString();
  const maxSelectableCount = isAdmin ? 0 : remainingSlotsCount;
  const statusText = bookingStatusText({
    isAdmin,
    remainingSlotsCount,
    interviews,
    upcomingInterview: nextUpcomingInterview,
  });

  useEffect(() => {
    if (!bookingSlots.some((slot) => slot.value === singleDate)) {
      setSingleDate(findFirstSlot(bookingSlots));
    }
  }, [bookingSlots, singleDate]);

  useEffect(() => {
    if (!bookingSlots.some((slot) => slot.value === bulkDate)) {
      setBulkDate(findFirstSlot(bookingSlots));
    }
  }, [bookingSlots, bulkDate]);

  useEffect(() => {
    if (!bookingSlots.some((slot) => slot.value === editDate)) {
      setEditDate(findFirstSlot(bookingSlots));
    }
  }, [bookingSlots, editDate]);

  useEffect(() => {
    if (!availableCompanies.some((company) => company.id === singleCompanyId)) {
      setSingleCompanyId(availableCompanies[0]?.id ?? '');
    }
  }, [availableCompanies, singleCompanyId]);

  useEffect(() => {
    const validIds = new Set(availableCompanies.map((company) => company.id));
    setSelectedCompanyIds((current) => current.filter((companyId) => validIds.has(companyId)));
  }, [availableCompanies]);

  const updateView = (updates: { section?: DashboardSectionKey; mode?: BookingMode }) => {
    router.replace(buildDashboardHref(pathname, new URLSearchParams(searchParams.toString()), updates), {
      scroll: false,
    });
  };

  const openReschedule = (interview: Interview) => {
    setEditingInterview(interview);
    setEditDate(interview.date);
    setSheetNotice(null);
  };

  const closeReschedule = () => {
    setEditingInterview(null);
    setSheetNotice(null);
  };

  const toggleCompany = (companyId: string, checked: boolean) => {
    if (!checked) {
      setSelectedCompanyIds((current) => current.filter((item) => item !== companyId));
      return;
    }

    if (maxSelectableCount === 0) {
      setMultiNotice({ text: 'คุณไม่มีสิทธิ์เหลือสำหรับการจองใหม่', tone: 'error' });
      return;
    }

    if (selectedCompanyIds.length >= maxSelectableCount) {
      setMultiNotice({
        text: `คุณเลือกได้สูงสุด ${maxSelectableCount} บริษัทตามสิทธิ์ที่เหลือ`,
        tone: 'error',
      });
      return;
    }

    setSelectedCompanyIds((current) => [...current, companyId]);
  };

  const submitSingleBooking = async () => {
    if (!token || !singleCompanyId || !singleDate) {
      return;
    }

    setSingleSubmitting(true);
    setSingleNotice(null);

    try {
      await createInterview(token, singleCompanyId, singleDate);
      setSingleNotice({ text: 'จองบริษัทเรียบร้อยแล้ว', tone: 'success' });
      updateView({ section: 'bookings' });
      await reload();
    } catch (err) {
      setSingleNotice({ text: err instanceof Error ? err.message : 'ไม่สามารถสร้างการจองได้', tone: 'error' });
    } finally {
      setSingleSubmitting(false);
    }
  };

  const submitBulkBooking = async () => {
    if (!token || selectedCompanyIds.length === 0 || !bulkDate) {
      return;
    }

    setMultiSubmitting(true);
    setMultiNotice(null);

    try {
      await createBulkInterviews(token, selectedCompanyIds, bulkDate);
      setMultiNotice({ text: 'จองหลายบริษัทเรียบร้อยแล้ว', tone: 'success' });
      setSelectedCompanyIds([]);
      updateView({ section: 'bookings' });
      await reload();
    } catch (err) {
      setMultiNotice({ text: err instanceof Error ? err.message : 'ไม่สามารถสร้างการจองได้', tone: 'error' });
    } finally {
      setMultiSubmitting(false);
    }
  };

  const submitInterviewUpdate = async () => {
    if (!token || !editingInterview || !editDate) {
      return;
    }

    setRescheduleSubmitting(true);
    setSheetNotice(null);

    try {
      await updateInterview(token, editingInterview.id, editDate);
      setBookingsNotice({ text: 'อัปเดตรอบสัมภาษณ์แล้ว', tone: 'success' });
      closeReschedule();
      await reload();
    } catch (err) {
      setSheetNotice({ text: err instanceof Error ? err.message : 'ไม่สามารถอัปเดตได้', tone: 'error' });
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const submitDeleteInterview = async (interviewId: string) => {
    if (!token) {
      return;
    }

    setDeleteBusyId(interviewId);
    setBookingsNotice(null);

    try {
      await deleteInterview(token, interviewId);
      setBookingsNotice({ text: 'ลบรอบสัมภาษณ์แล้ว', tone: 'success' });
      await reload();
    } catch (err) {
      setBookingsNotice({ text: err instanceof Error ? err.message : 'ไม่สามารถลบได้', tone: 'error' });
    } finally {
      setDeleteBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
    <div className="pb-12">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">แดชบอร์ดส่วนตัว</p>
            <h1 className="font-display text-4xl text-ink-900">ยินดีต้อนรับ, {user.name}</h1>
            <p className="max-w-3xl text-sm leading-6 text-ink-600">
              ใช้พื้นที่นี้เพื่อติดตามสิทธิ์ จองบริษัทใหม่ และจัดการรอบสัมภาษณ์ของคุณอย่างเป็นขั้นตอน
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge tone={isAdmin ? 'warm' : 'accent'}>{roleLabel(user.role)}</Badge>
            {isAdmin ? (
              <AnchorButton href="/admin" variant="secondary">
                เปิด Admin Workspace
              </AnchorButton>
            ) : (
              <AnchorButton href="/companies" variant="secondary">
                ดูรายชื่อบริษัท
              </AnchorButton>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="บทบาท" value={roleLabel(user.role)} note="บทบาทจากเซสชันที่กำลังใช้งาน" />
          <StatCard label="การจองทั้งหมด" value={bookedCount.toString()} note="รายการที่พร้อมจัดการได้ทันที" />
          <StatCard label="สิทธิ์คงเหลือ" value={remainingSlotsLabel} note="บัญชีผู้ใช้ทั่วไปจองได้สูงสุด 3 ครั้ง" />
          <StatCard
            label="รอบถัดไป"
            value={nextUpcomingInterview ? formatDate(nextUpcomingInterview.date) : 'ยังไม่มี'}
            note={nextUpcomingInterview ? interviewCompanyName(nextUpcomingInterview) : 'ไปที่ New Booking เพื่อเริ่มต้น'}
          />
        </div>
      </div>

      <WorkspaceTabs activeSection={activeSection} onChange={(section) => updateView({ section })} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === 'overview' ? (
          <OverviewSection
            isAdmin={isAdmin}
            interviews={interviews}
            nextUpcomingInterview={nextUpcomingInterview}
            remainingSlotsLabel={remainingSlotsLabel}
            remainingSlotsCount={remainingSlotsCount}
            statusText={statusText}
            onOpenNewSingle={() => updateView({ section: 'new', mode: 'single' })}
            onOpenNewMulti={() => updateView({ section: 'new', mode: 'multi' })}
            onOpenBookings={() => updateView({ section: 'bookings' })}
          />
        ) : null}

        {activeSection === 'new' ? (
          <NewBookingSection
            availableCompanies={availableCompanies}
            bookedCount={bookedCount}
            bookingMode={bookingMode}
            bookingSlots={bookingSlots}
            isAdmin={isAdmin}
            maxSelectableCount={maxSelectableCount}
            multiCompanyIds={selectedCompanyIds}
            multiNotice={multiNotice}
            multiQuery={companyQuery}
            multiSubmitting={multiSubmitting}
            onChangeMode={(mode) => updateView({ mode })}
            onMultiQueryChange={setCompanyQuery}
            onOpenAdmin={() => updateView({ section: 'bookings' })}
            onSubmitMulti={() => void submitBulkBooking()}
            onSubmitSingle={() => void submitSingleBooking()}
            onToggleCompany={toggleCompany}
            remainingSlotsLabel={remainingSlotsLabel}
            selectedSingleCompanyId={singleCompanyId}
            singleDate={singleDate}
            singleNotice={singleNotice}
            singleSubmitting={singleSubmitting}
            onSelectSingleCompany={setSingleCompanyId}
            onSingleDateChange={setSingleDate}
            onBulkDateChange={setBulkDate}
            bulkDate={bulkDate}
          />
        ) : null}

        {activeSection === 'bookings' ? (
          <MyBookingsSection
            bookingsNotice={bookingsNotice}
            deleteBusyId={deleteBusyId}
            interviews={sortedInterviews}
            isAdmin={isAdmin}
            onOpenReschedule={openReschedule}
            onOpenOverview={() => updateView({ section: 'overview' })}
            onDeleteInterview={(interviewId) => void submitDeleteInterview(interviewId)}
          />
        ) : null}
      </div>

      <UserSheet
        open={editingInterview !== null}
        onClose={closeReschedule}
        title="Reschedule booking"
        description="ปรับวันสัมภาษณ์ของรายการนี้โดยไม่ออกจากหน้าแดชบอร์ด"
      >
        {editingInterview ? (
          <div className="space-y-5">
            <Panel className="space-y-3 p-5">
              <div>
                <p className="text-sm font-semibold text-ink-900">{interviewCompanyName(editingInterview)}</p>
                <p className="mt-1 text-sm text-ink-500">{editingInterview.company.address}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">เวลาปัจจุบัน</p>
                <p className="mt-2 text-sm text-ink-900">{formatDateTime(editingInterview.date)}</p>
              </div>
            </Panel>

            {sheetNotice ? <Alert message={sheetNotice.text} tone={sheetNotice.tone} /> : null}
            <div>
              <Field label="ช่วงเวลาใหม่">
                <Select value={editDate} onChange={(event) => setEditDate(event.target.value)}>
                  {bookingSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => void submitInterviewUpdate()}
              disabled={rescheduleSubmitting || !editDate}
            >
              {rescheduleSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        ) : null}
      </UserSheet>
    </div>
  );
}
