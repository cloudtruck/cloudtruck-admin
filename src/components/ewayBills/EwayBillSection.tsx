'use client';

import { useEffect, useState, useCallback } from 'react';
import { ewayBillApi } from '@/lib/api';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import type { EwayBill } from '@/types';

interface EwayBillSectionProps {
  bookingId: string;
}

export default function EwayBillSection({ bookingId }: EwayBillSectionProps) {
  const { user } = useAuth();
  const { openCreateModal, openUpdateModal, openDetailsModal } = useEwayBillStore();
  const [ewayBills, setEwayBills] = useState<EwayBill[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreateEwayBill = user?.role === 'admin' || user?.role === 'super-admin';
  const canUpdatePartB = user?.role === 'admin' || user?.role === 'super-admin';

  const fetchEwayBills = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ewayBillApi.getAll({ bookingId });
      if (response.data.success) {
        setEwayBills(response.data.data.ewayBills);
      }
    } catch {
      // Quietly fail as this is a sub-section
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchEwayBills();
  }, [fetchEwayBills]);

  const getStatusBadge = (bill: EwayBill) => {
    const hoursUntilExpiry = differenceInHours(new Date(bill.validUntil), new Date());

    if (bill.status === 'expired') {
      return (
        <Badge variant="destructive" className="text-xs">
          Expired
        </Badge>
      );
    }

    if (hoursUntilExpiry <= 48 && hoursUntilExpiry > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
          Expiring ({hoursUntilExpiry}h)
        </Badge>
      );
    }

    if (bill.status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          Active
        </Badge>
      );
    }

    return <Badge className="text-xs">{bill.status}</Badge>;
  };

  const getSyncStatusBadge = (bill: EwayBill) => {
    if (bill.autoSynced) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <CheckCircle2 className="h-3 w-3" />
          <span>Auto-Synced</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-xs text-orange-600">
        <AlertTriangle className="h-3 w-3" />
        <span>Pending Manual Update</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">E-way Bills</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">E-way Bills</h3>
        {canCreateEwayBill && (
          <Button size="sm" onClick={() => openCreateModal(bookingId)}>
            <Plus className="mr-2 h-4 w-4" />
            Create E-way Bill
          </Button>
        )}
      </div>

      {ewayBills.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No E-way bills linked to this booking</p>
          {canCreateEwayBill && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => openCreateModal(bookingId)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First E-way Bill
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ewayBills.map((bill) => (
            <Card key={bill._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-semibold text-lg">
                      {bill.ewayBillNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bill.partA.consignorState} → {bill.partA.consigneeState}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(bill)}
                    {getSyncStatusBadge(bill)}
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Valid Until</div>
                    <div className="font-medium">
                      {format(new Date(bill.validUntil), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Vehicle</div>
                    <div className="font-mono font-medium flex items-center gap-2">
                      {bill.partB.vehicleNumber}
                      {bill.autoSynced && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Part-B Status Indicator */}
                {!bill.autoSynced && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2">
                    <div className="flex items-center gap-2 text-xs text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        Vehicle number needs manual update on NIC portal
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsModal(bill)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {canUpdatePartB && bill.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateModal(bill)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Update Part-B
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
