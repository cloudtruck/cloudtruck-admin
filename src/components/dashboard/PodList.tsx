'use client';

import { Inbox, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';

interface PodListProps {
  bookings: Booking[];
  loading?: boolean;
}

function Th({ children, search }: { children: React.ReactNode; search?: boolean }) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100 sticky top-0">
      {search ? (
        <div className="flex items-center gap-1">
          {children}
          <svg
            className="h-2.5 w-2.5 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      ) : (
        children
      )}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap border-b border-gray-50',
        className
      )}
    >
      {children}
    </td>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function PodList({ bookings, loading }: PodListProps) {
  function handleExport() {
    const headers = [
      'ID',
      'Indent Id',
      'LR No',
      'LR Date',
      'Soft Verified',
      'Weight',
      'Traffic',
      'Supervisor',
      'Customer',
      'Branch(S)',
      'Source',
      'Source Code',
      'Branch(D)',
      'Pod Uploaded By',
      'Destination',
      'Destination Code',
      'Supplier',
      'Truck',
      'Truck Type',
      'Driver No',
      'Km',
    ];
    const rows = bookings.map((b) => {
      const lrDate = b.lrDetails?.lrDate || null;
      const weightStr = b.weight ? `${b.weight.value} ${b.weight.unit || 'kg'}` : '';
      const podUploadedBy = b.podDetails
        ? (() => {
            const ub = b.podDetails?.uploadedBy;
            return typeof ub === 'string' ? ub : ub?.name || '';
          })()
        : '';
      const km = b.tripKm ?? b.actualKm ?? '';
      return [
        b._id.slice(-6).toUpperCase(),
        b.bookingId || '',
        b.lrDetails?.lrNumber || b.lrNumber || '',
        lrDate ? fmtDate(lrDate) : '',
        b.podType === 'Soft' ? 'Yes' : 'No',
        weightStr,
        b.trafficController?.name || '',
        b.supervisor?.name || '',
        b.customer?.companyName || '',
        b.pickup?.city || '',
        b.pickup?.address || '',
        b.sourceCode || '',
        b.drop?.city || '',
        podUploadedBy,
        b.drop?.address || '',
        b.destinationCode || '',
        b.supplierEntity?.displayName || '',
        b.vehicle?.vehicleNumber || '',
        b.vehicle?.truckType || '',
        b.driver?.phone || '',
        km,
      ];
    });
    downloadCsv('pod-list.csv', toCsvString(headers, rows));
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
        <div className="flex-1" />
        <FileText
          aria-label="Export"
          onClick={handleExport}
          className="h-4 w-4 text-green-600 cursor-pointer hover:text-green-700"
        />
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">No data</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>DL</Th>
                <Th search>Indent Id</Th>
                <Th search>LR No</Th>
                <Th search>LR Date</Th>
                <Th>Soft Verified</Th>
                <Th>Weight</Th>
                <Th>Traffic</Th>
                <Th search>Supervisor</Th>
                <Th search>Customer</Th>
                <Th>Branch(S)</Th>
                <Th>Source Name</Th>
                <Th>Source</Th>
                <Th>Branch(D)</Th>
                <Th>Pod Uploaded By</Th>
                <Th>Destination Name</Th>
                <Th>Destination</Th>
                <Th>Supplier</Th>
                <Th>Truck</Th>
                <Th>Truck Type</Th>
                <Th>Driver No</Th>
                <Th>Km</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const lrDate = b.lrDetails?.lrDate || null;
                const isSoftVerified = b.podType === 'Soft';
                const weightStr = b.weight
                  ? `${b.weight.value} ${b.weight.unit || b.weightUnit || 'kg'}`
                  : '—';
                const podUploadedBy = b.podDetails
                  ? (() => {
                      const ub = b.podDetails?.uploadedBy;
                      return typeof ub === 'string' ? ub : ub?.name || '—';
                    })()
                  : '—';
                const km = b.tripKm ?? b.actualKm;

                return (
                  <tr
                    key={b._id}
                    className={cn(
                      'hover:bg-blue-50/30 transition-colors',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    )}
                  >
                    <Td className="text-gray-400 text-[10px]">{b._id.slice(-6).toUpperCase()}</Td>
                    {/* Download icon */}
                    <Td>
                      {b.lrDetails?.documents?.[0]?.url ? (
                        <a
                          href={b.lrDetails.documents[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                          title="Download LR"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Download className="h-3.5 w-3.5 text-gray-200" />
                      )}
                    </Td>
                    <Td className="font-medium text-blue-600">{b.bookingId || '—'}</Td>
                    <Td>{b.lrDetails?.lrNumber || b.lrNumber || '—'}</Td>
                    <Td>{fmtDate(lrDate)}</Td>
                    <Td>
                      {isSoftVerified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                          No
                        </span>
                      )}
                    </Td>
                    <Td>{weightStr}</Td>
                    <Td>{b.trafficController?.name || '—'}</Td>
                    <Td>{b.supervisor?.name || '—'}</Td>
                    <Td>{b.customer?.companyName || '—'}</Td>
                    {/* Branch(S) — pickup city as branch proxy */}
                    <Td>{b.pickup?.city || '—'}</Td>
                    {/* Source Name */}
                    <Td>{b.pickup?.address || '—'}</Td>
                    {/* Source code */}
                    <Td>{b.sourceCode || '—'}</Td>
                    {/* Branch(D) — drop city as branch proxy */}
                    <Td>{b.drop?.city || '—'}</Td>
                    <Td>{podUploadedBy}</Td>
                    {/* Destination Name */}
                    <Td>{b.drop?.address || '—'}</Td>
                    {/* Destination code */}
                    <Td>{b.destinationCode || '—'}</Td>
                    <Td>{b.supplierEntity?.displayName || '—'}</Td>
                    <Td className="font-medium">{b.vehicle?.vehicleNumber || '—'}</Td>
                    <Td>{b.vehicle?.truckType || '—'}</Td>
                    <Td>{b.driver?.phone || '—'}</Td>
                    <Td>{km != null ? `${km} km` : '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
