'use client';

import { Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ContactNumberProps {
  phone: string;
}

export function ContactNumber({ phone }: ContactNumberProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    toast.success('Number copied');
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-sm text-muted-foreground">{phone}</span>
      <a
        href={`tel:${phone}`}
        className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
        title="Call"
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
        title="Copy number"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
