'use client';

/**
 * SideSelect — a Digitify-style field that opens a right slide-in panel
 * with search + radio list instead of an inline dropdown.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SideSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SideSelectProps {
  label: string;
  placeholder?: string;
  options: SideSelectOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  /** Panel title shown in the slide-in header */
  panelTitle?: string;
  /** Show a clear (×) button when a value is selected */
  clearable?: boolean;
  onClear?: () => void;
}

export function SideSelect({
  label,
  placeholder = 'Select',
  options,
  value,
  onChange,
  required,
  disabled,
  searchable = true,
  panelTitle,
  clearable,
  onClear,
}: SideSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim().length === 0
    ? options
    : options.filter((o) =>
        (o.label || '').toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel || '').toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      {/* Trigger field */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-sm transition-colors text-left cursor-pointer',
          'bg-white border-gray-200 hover:border-blue-400 focus:outline-none focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          !selected && 'text-gray-400'
        )}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        {clearable && selected && onClear ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 -m-1"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in panel — only mounted when open to avoid shadow bleed */}
      {open && <div
        className="fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col"
      >
        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {panelTitle || label}
          </span>
        </div>

        {/* Search */}
        {searchable && (
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Min 3 Letters"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Options list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Search className="h-10 w-10 opacity-30" />
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((opt, i) => (
                <li key={`${opt.value}-${i}`}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left',
                      opt.value === value && 'bg-blue-50'
                    )}
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                        opt.value === value
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      )}
                    >
                      {opt.value === value && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className={cn('font-medium', opt.value === value && 'text-blue-700')}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-xs text-gray-400 truncate">{opt.sublabel}</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>}
    </>
  );
}
