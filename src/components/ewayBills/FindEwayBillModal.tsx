'use client';

import { useState } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface FindEwayBillModalProps {
  onSuccessAction?: () => void;
}

export default function FindEwayBillModal({ onSuccessAction }: FindEwayBillModalProps) {
  const { findModalOpen, closeFindModal, setLoading: setGlobalLoading } = useEwayBillStore();
  const [ewayBillNumber, setEwayBillNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ewayBillNumber || ewayBillNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit E-way bill number');
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      const response = await ewayBillApi.sync(ewayBillNumber);

      if (response.data.success) {
        toast.success('E-way bill synced successfully');
        closeFindModal();
        if (onSuccessAction) onSuccessAction();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        'Failed to find E-way bill. Please ensure the number is correct and it exists on the NIC portal.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <Dialog open={findModalOpen} onOpenChange={closeFindModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Eway-Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFind} className="py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eway-number" className="text-sm font-medium">
              <span className="text-red-500 mr-1">*</span>Eway-bill
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="eway-number"
                placeholder="Enter eway number"
                value={ewayBillNumber}
                onChange={(e) => setEwayBillNumber(e.target.value)}
                maxLength={12}
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || ewayBillNumber.length !== 12}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
