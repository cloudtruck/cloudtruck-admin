'use client';

import { useEwayBillStore } from '@/store/ewayBillStore';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import type { EwayBill } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type TabValue = 'part-b-pending' | 'active' | 'expiring' | 'expired' | 'manual-override';

interface Props {
  tab: TabValue;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
      <Inbox className="h-12 w-12 text-gray-200" strokeWidth={1} />
      <span className="text-sm text-gray-400">No data</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// Standard table for Part-B Pending / Active / Expiring / Expired
function StandardTable({
  bills,
  canUpdatePartB,
  openDetailsModal,
  openUpdateModal,
}: {
  bills: EwayBill[];
  canUpdatePartB: boolean;
  openDetailsModal: (b: EwayBill) => void;
  openUpdateModal: (b: EwayBill) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Actions
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Eway no
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Company
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            From Place
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            To Place
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Truck no
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Distance
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Doc No
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Doc Date
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Created at
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Valid till
          </th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr
            key={bill._id}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="py-3 px-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                  onClick={() => openDetailsModal(bill)}
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {canUpdatePartB && bill.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                    onClick={() => openUpdateModal(bill)}
                    title="Update Part-B"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </td>
            <td className="py-3 px-4 font-medium text-blue-600">{bill.ewayBillNumber}</td>
            <td className="py-3 px-4 text-gray-700">
              {bill.partA.consignorTradeName || bill.partA.consignorLegalName || '—'}
            </td>
            <td className="py-3 px-4 text-gray-700">{bill.partA.consignorState || '—'}</td>
            <td className="py-3 px-4 text-gray-700">{bill.partA.consigneeState || '—'}</td>
            <td className="py-3 px-4 text-gray-700">{bill.partB.vehicleNumber || '—'}</td>
            <td className="py-3 px-4 text-gray-700">—</td>
            <td className="py-3 px-4 text-gray-700">{bill.partA.documentNumber || '—'}</td>
            <td className="py-3 px-4 text-gray-700">
              {bill.partA.documentDate
                ? format(new Date(bill.partA.documentDate), 'dd/MM/yyyy')
                : '—'}
            </td>
            <td className="py-3 px-4 text-gray-700">
              {bill.createdAt ? format(new Date(bill.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
            </td>
            <td
              className={cn(
                'py-3 px-4',
                bill.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-700'
              )}
            >
              {bill.validUntil ? format(new Date(bill.validUntil), 'dd/MM/yyyy HH:mm') : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Manual tab table: Eway Bill, Created at, Valid till, Trip id, Truck no
function ManualTable({
  bills,
  openDetailsModal,
}: {
  bills: EwayBill[];
  openDetailsModal: (b: EwayBill) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Eway Bill
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Created at
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Valid till
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Trip id
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
            Truck no
          </th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr
            key={bill._id}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="py-3 px-4">
              <button
                className="font-medium text-blue-600 hover:underline"
                onClick={() => openDetailsModal(bill)}
              >
                {bill.ewayBillNumber}
              </button>
            </td>
            <td className="py-3 px-4 text-gray-700">
              {bill.createdAt ? format(new Date(bill.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
            </td>
            <td
              className={cn(
                'py-3 px-4',
                bill.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-700'
              )}
            >
              {bill.validUntil ? format(new Date(bill.validUntil), 'dd/MM/yyyy HH:mm') : '—'}
            </td>
            <td className="py-3 px-4 text-gray-700">{bill.booking?.bookingId || '—'}</td>
            <td className="py-3 px-4 text-gray-700">{bill.partB.vehicleNumber || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EwayBillsTable({ tab }: Props) {
  const { user } = useAuth();
  const { ewayBills, loading, openDetailsModal, openUpdateModal } = useEwayBillStore();
  const canUpdatePartB = user?.role === 'admin' || user?.role === 'super-admin';

  if (loading) return <LoadingState />;

  const isEmpty = !ewayBills || ewayBills.length === 0;

  return (
    <div className="overflow-x-auto">
      {tab === 'manual-override' ? (
        <>
          <ManualTable bills={isEmpty ? [] : ewayBills} openDetailsModal={openDetailsModal} />
          {isEmpty && <EmptyState />}
        </>
      ) : (
        <>
          <StandardTable
            bills={isEmpty ? [] : ewayBills}
            canUpdatePartB={canUpdatePartB}
            openDetailsModal={openDetailsModal}
            openUpdateModal={openUpdateModal}
          />
          {isEmpty && <EmptyState />}
        </>
      )}
    </div>
  );
}
