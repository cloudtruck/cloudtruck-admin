'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditSettingModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  value: string | number;
  inputType?: 'text' | 'number';
  maxLength?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  hint?: string;
  transform?: (v: string) => string;
  onSave: (value: string) => Promise<void> | void;
}

export function EditSettingModal({
  open,
  onClose,
  title,
  label,
  value,
  inputType = 'text',
  maxLength,
  min,
  max,
  placeholder,
  hint,
  transform,
  onSave,
}: EditSettingModalProps) {
  const [draft, setDraft] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(String(value ?? ''));
      setError('');
    }
  }, [open, value]);

  const handleChange = (raw: string) => {
    const v = transform ? transform(raw) : raw;
    setDraft(v);
    setError('');
  };

  const validate = (): boolean => {
    if (inputType === 'number') {
      const n = parseFloat(draft);
      if (isNaN(n)) { setError('Please enter a valid number'); return false; }
      if (min !== undefined && n < min) { setError(`Minimum value is ${min}`); return false; }
      if (max !== undefined && n > max) { setError(`Maximum value is ${max}`); return false; }
    }
    if (maxLength && draft.length > maxLength) {
      setError(`Maximum ${maxLength} characters`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">{label}</label>
            <input
              type={inputType}
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={maxLength}
              min={min}
              max={max}
              placeholder={placeholder}
              autoFocus
              className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
