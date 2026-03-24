'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button, EmptyState, Input } from '@/components/shadcn-ui';
import { cn } from '@/lib/utils';

type SearchSelectPickerProps<T> = {
  open: boolean;
  title: string;
  description?: string;
  items: T[];
  selectedId?: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  getId: (item: T) => string;
  getSearchText: (item: T) => string;
  renderItem: (item: T, state: { active: boolean; selected: boolean }) => React.ReactNode;
  onSelect: (item: T) => void;
  onClose: () => void;
};

type SearchSelectFieldProps<T> = {
  title: string;
  description?: string;
  items: T[];
  selectedId?: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  getId: (item: T) => string;
  getSearchText: (item: T) => string;
  renderItem: (item: T, state: { active: boolean; selected: boolean }) => React.ReactNode;
  renderSelection: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  disabled?: boolean;
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('aria-hidden'));
}

export function SearchSelectPicker<T,>({
  open,
  title,
  description,
  items,
  selectedId,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  getId,
  getSearchText,
  renderItem,
  onSelect,
  onClose,
}: SearchSelectPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const filteredItems = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) => getSearchText(item).toLowerCase().includes(term));
  }, [deferredQuery, getSearchText, items]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery('');

    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = filteredItems.findIndex((item) => getId(item) === selectedId);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredItems, getId, open, selectedId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    activeItemRef.current?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex, open]);

  if (!open) {
    return null;
  }

  const handleSelect = (item: T) => {
    onSelect(item);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => {
        if (filteredItems.length === 0) {
          return 0;
        }
        return (current + 1) % filteredItems.length;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => {
        if (filteredItems.length === 0) {
          return 0;
        }
        return (current - 1 + filteredItems.length) % filteredItems.length;
      });
      return;
    }

    if (event.key === 'Enter' && filteredItems[activeIndex]) {
      event.preventDefault();
      handleSelect(filteredItems[activeIndex]);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && (currentIndex <= 0 || document.activeElement === first)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && (currentIndex === -1 || document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] !mt-0">
      <button
        type="button"
        aria-label="ปิดตัวเลือก"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-white lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(80vh,720px)] lg:w-[min(720px,calc(100vw-3rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:overflow-hidden lg:rounded-xl lg:border lg:border-zinc-200 lg:shadow-[0_28px_90px_rgba(0,0,0,0.2)]"
      >
        <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="eyebrow">Quick Select</p>
              <h3 className="font-display text-2xl text-ink-900">{title}</h3>
              {description ? <p className="max-w-2xl text-sm leading-6 text-ink-600">{description}</p> : null}
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>

        <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {filteredItems.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, index) => {
                const itemId = getId(item);
                const active = index === activeIndex;
                const selected = itemId === selectedId;

                return (
                  <button
                    key={itemId}
                    ref={active ? activeItemRef : null}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-colors',
                      active || selected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50',
                    )}
                  >
                    <div className="min-w-0 flex-1">{renderItem(item, { active, selected })}</div>
                    <div className="pt-1">
                      {selected ? (
                        <span className={cn('text-xs font-semibold', active ? 'text-white/90' : 'text-zinc-900')}>
                          SELECTED
                        </span>
                      ) : active ? (
                        <span className="text-xs font-semibold text-white/75">ENTER</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchSelectField<T,>({
  title,
  description,
  items,
  selectedId,
  placeholder,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  getId,
  getSearchText,
  renderItem,
  renderSelection,
  onSelect,
  disabled = false,
}: SearchSelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedItem = useMemo(
    () => items.find((item) => getId(item) === selectedId) ?? null,
    [getId, items, selectedId],
  );

  const closePicker = () => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    closePicker();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors',
          'focus-visible:border-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          open ? 'border-zinc-900' : 'hover:border-zinc-300',
        )}
      >
        <div className="min-w-0 flex-1">
          {selectedItem ? (
            renderSelection(selectedItem)
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">{placeholder}</p>
              {description ? <p className="text-xs text-zinc-400">{description}</p> : null}
            </div>
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Search
        </span>
      </button>

      <SearchSelectPicker
        open={open}
        title={title}
        description={description}
        items={items}
        selectedId={selectedId}
        searchPlaceholder={searchPlaceholder}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        getId={getId}
        getSearchText={getSearchText}
        renderItem={renderItem}
        onSelect={handleSelect}
        onClose={closePicker}
      />
    </>
  );
}
