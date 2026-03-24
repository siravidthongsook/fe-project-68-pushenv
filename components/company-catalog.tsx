'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOptionalAuth } from '@/components/auth-provider';
import { AnchorButton, Badge, EmptyState, Input, Panel, Spinner } from '@/components/shadcn-ui';
import { getCompanies } from '@/lib/api';
import type { Company } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

function CompanyCard({ company }: { company: Company }) {
  return (
    <Panel className="flex h-full flex-col justify-between p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink-900">{company.name}</h2>
            <p className="mt-1 text-sm text-ink-500">{company.address}</p>
          </div>
          <Badge tone="accent">{company.bookingCount} การจอง</Badge>
        </div>
        <p className="text-sm leading-6 text-ink-600">{company.description}</p>
        <div className="space-y-2 text-sm text-ink-600">
          <p>
            <span className="font-medium text-ink-900">โทร:</span> {company.tel}
          </p>
          {company.website ? (
            <p>
              <span className="font-medium text-ink-900">เว็บไซต์:</span>{' '}
              <a href={company.website} target="_blank" rel="noreferrer" className="text-accent-700 underline">
                {company.website}
              </a>
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <AnchorButton href={`/companies/${company.id}`}>ดูรายละเอียด</AnchorButton>
      </div>
    </Panel>
  );
}

export function CompanyCatalog() {
  const auth = useOptionalAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);


  useEffect(() => {
    let active = true;
    setLoading(true);

    getCompanies(auth?.token ?? null)
      .then((result) => {
        if (!active) {
          return;
        }
        setCompanies(result);
        setError(null);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดรายชื่อบริษัทได้');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth?.token]);

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      [company.name, company.address, company.description, company.tel]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [companies, debouncedQuery]);

  const isDebouncing = query !== debouncedQuery;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">รายชื่อบริษัท</p>
            <h1 className="font-display text-4xl text-ink-900">บริษัทที่เข้าร่วมงาน Job Fair</h1>
            <p className="max-w-3xl text-sm leading-6 text-ink-600">
              ค้นหาและดูข้อมูลบริษัทก่อนเข้าสู่ขั้นตอนจองสัมภาษณ์
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {auth?.user ? (
              <AnchorButton href={auth.user.role === 'admin' ? '/admin' : '/dashboard'} variant="secondary">
                ไปยัง{auth.user.role === 'admin' ? 'ผู้ดูแล' : 'แดชบอร์ด'}
              </AnchorButton>
            ) : null}
          </div>
        </div>

        <Panel className="p-4 sm:p-5">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาจากชื่อ ที่อยู่ หรือเบอร์โทร"
              className={isDebouncing ? 'pr-24' : undefined}
            />
            {isDebouncing && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                กำลังค้นหา...
              </span>
            )}
          </div>
        </Panel>

        {loading ? (
          <Panel className="p-6">
            <Spinner label="กำลังโหลดรายชื่อบริษัท..." />
          </Panel>
        ) : error ? (
          <Panel className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          </Panel>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="ไม่พบบริษัท"
            description="ลองค้นหาด้วยคำอื่นหรือรีเฟรชหน้าใหม่"
            action={<AnchorButton href="/" variant="secondary">กลับหน้าหลัก</AnchorButton>}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
