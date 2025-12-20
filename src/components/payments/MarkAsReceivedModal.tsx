'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { paymentApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const markAsReceivedSchema = z.object({
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  paidAt: z.date(),
  notes: z.string().optional(),
});

type MarkAsReceivedFormData = z.infer<typeof markAsReceivedSchema>;

interface MarkAsReceivedModalProps {
  paymentId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkAsReceivedModal({
  paymentId,
  open,
  onClose,
  onSuccess,
}: MarkAsReceivedModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<MarkAsReceivedFormData>({
    resolver: zodResolver(markAsReceivedSchema),
    defaultValues: {
      transactionReference: '',
      paidAt: new Date(),
      notes: '',
    },
  });

  const onSubmit = async (data: MarkAsReceivedFormData) => {
    if (!paymentId) return;

    setLoading(true);
    try {
      await paymentApi.markAsReceived(paymentId, {
        transactionReference: data.transactionReference,
        paidAt: data.paidAt.toISOString(),
        notes: data.notes,
      });

      toast.success('Payment marked as received');
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to mark payment as received:', error);
      toast.error('Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Payment as Received</DialogTitle>
          <DialogDescription>
            Enter the transaction details for manual payment confirmation (NEFT/RTGS/Cash)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="UTR/Reference Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('2020-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this payment..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Mark as Received'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
