'use client';

import { useEwayBillStore } from '@/store/ewayBillStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Download } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import type { EwayBill } from '@/types';
import { exportToCSV, exportToExcel } from '@/lib/export';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function EwayBillsTable() {
  const { user } = useAuth();
  const {
    ewayBills,
    loading,
    pagination,
    setPagination,
    openDetailsModal,
    openUpdateModal,
  } = useEwayBillStore();

  const canUpdatePartB = user?.role === 'admin' || user?.role === 'super-admin';

  const getStatusBadge = (bill: EwayBill) => {
    const hoursUntilExpiry = differenceInHours(new Date(bill.validUntil), new Date());

    if (bill.status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (hoursUntilExpiry <= 48 && hoursUntilExpiry > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Expiring ({hoursUntilExpiry}h)
        </Badge>
      );
    }

    if (bill.status === 'active') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }

    if (bill.status === 'cancelled') {
      return <Badge variant="outline">Cancelled</Badge>;
    }

    return <Badge>{bill.status}</Badge>;
  };

  const getPartBStatusBadge = (bill: EwayBill) => {
    if (bill.autoSynced) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          🔄 Auto-Synced
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        ⚠️ Pending Manual Update
      </Badge>
    );
  };

  const handleExportCSV = () => {
    try {
      const data = ewayBills.map((bill) => ({
        'E-way Bill No': bill.ewayBillNumber,
        'Booking ID': bill.booking?.bookingId || 'N/A',
        Route: `${bill.partA.consignorState} → ${bill.partA.consigneeState}`,
        Status: bill.status,
        'Valid Until': format(new Date(bill.validUntil), 'dd MMM yyyy HH:mm'),
        'Part-B Status': bill.autoSynced ? 'Auto-Synced' : 'Pending',
        'Vehicle Number': bill.partB.vehicleNumber,
      }));
      exportToCSV(data, 'eway-bills');
      toast.success('Exported to CSV successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportExcel = () => {
    try {
      const data = ewayBills.map((bill) => ({
        'E-way Bill No': bill.ewayBillNumber,
        'Booking ID': bill.booking?.bookingId || 'N/A',
        Route: `${bill.partA.consignorState} → ${bill.partA.consigneeState}`,
        Status: bill.status,
        'Valid Until': format(new Date(bill.validUntil), 'dd MMM yyyy HH:mm'),
        'Part-B Status': bill.autoSynced ? 'Auto-Synced' : 'Pending',
        'Vehicle Number': bill.partB.vehicleNumber,
        'Consignor GSTIN': bill.partA.consignorGSTIN,
        'Consignee GSTIN': bill.partA.consigneeGSTIN,
        'Total Value': bill.partA.totalValue,
      }));
      exportToExcel(data, 'eway-bills');
      toast.success('Exported to Excel successfully');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ewayBills || ewayBills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No E-way bills found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-way Bill No</TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Part-B Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ewayBills.map((bill) => (
              <TableRow key={bill._id}>
                <TableCell className="font-medium">{bill.ewayBillNumber}</TableCell>
                <TableCell>{bill.booking?.bookingId || 'N/A'}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {bill.partA.consignorState} → {bill.partA.consigneeState}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(bill)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(bill.validUntil), 'dd MMM yyyy')}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(bill.validUntil), 'HH:mm')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getPartBStatusBadge(bill)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {bill.partB.vehicleNumber}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDetailsModal(bill)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canUpdatePartB && bill.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openUpdateModal(bill)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
