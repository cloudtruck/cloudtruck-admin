'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { exportApi } from '@/lib/api';
import { downloadBlob } from '@/lib/export';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Download, Truck, CreditCard, UserCheck, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: 'bookings' | 'payments' | 'drivers' | 'customers') => {
    setLoading(type);
    try {
      const params: Record<string, string> = {};
      if (dateRange.from) {
        params.dateFrom = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange.to) {
        params.dateTo = format(dateRange.to, 'yyyy-MM-dd');
      }

      const response = await exportApi[type](params);
      const filename = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      downloadBlob(response.data, filename);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully`);
    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
      toast.error(`Failed to export ${type} report`);
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id: 'bookings',
      title: 'Bookings Report',
      description: 'Export all bookings with details including status, route, material, payment info',
      icon: Truck,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'payments',
      title: 'Payments Report',
      description: 'Export payment records with transaction details, amounts, and status',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'drivers',
      title: 'Driver Performance Report',
      description: 'Export driver data including trips completed, ratings, and availability',
      icon: UserCheck,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'customers',
      title: 'Customer Report',
      description: 'Export customer list with company details, booking count, and payment history',
      icon: Building2,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Export"
        description="Generate and download reports in Excel format"
      />

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>
            Select a date range to filter reports. Leave empty for all-time data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-60 justify-start text-left font-normal',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-60 justify-start text-left font-normal',
                    !dateRange.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(dateRange.from || dateRange.to) && (
              <Button
                variant="outline"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="transition-all hover:shadow-md border-muted/60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <div className={cn("p-3 rounded-xl flex items-center justify-center", report.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport(report.id as 'bookings' | 'payments' | 'drivers' | 'customers')}
                  disabled={loading === report.id}
                  className="w-full"
                >
                  {loading === report.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
