'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import type { PartBHistoryEntry } from '@/types';
import { toast } from 'sonner';

export default function EwayBillDetailsModal() {
  const { detailsModalOpen, closeDetailsModal, selectedBill } = useEwayBillStore();
  const [history, setHistory] = useState<PartBHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!selectedBill) return;

    setLoadingHistory(true);
    try {
      const response = await ewayBillApi.getHistory(selectedBill._id);
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch {
      toast.error('Failed to fetch history');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedBill]);

  useEffect(() => {
    if (detailsModalOpen && selectedBill) {
      fetchHistory();
    }
  }, [detailsModalOpen, selectedBill, fetchHistory]);

  if (!selectedBill) return null;

  return (
    <Dialog open={detailsModalOpen} onOpenChange={closeDetailsModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>E-way Bill Details: {selectedBill.ewayBillNumber}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="part-a" className="space-y-4">
          <TabsList>
            <TabsTrigger value="part-a">Part A</TabsTrigger>
            <TabsTrigger value="part-b">Part B</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Part A Tab */}
          <TabsContent value="part-a" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Consignor (Sender)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">GSTIN</div>
                  <div className="font-mono">{selectedBill.partA.consignorGSTIN}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Legal Name</div>
                  <div className="font-medium">{selectedBill.partA.consignorLegalName}</div>
                </div>
                {selectedBill.partA.consignorTradeName && (
                  <div>
                    <div className="text-muted-foreground">Trade Name</div>
                    <div>{selectedBill.partA.consignorTradeName}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">State</div>
                  <div>{selectedBill.partA.consignorState}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Address</div>
                  <div>{selectedBill.partA.consignorAddress}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Consignee (Receiver)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">GSTIN</div>
                  <div className="font-mono">{selectedBill.partA.consigneeGSTIN}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Legal Name</div>
                  <div className="font-medium">{selectedBill.partA.consigneeLegalName}</div>
                </div>
                {selectedBill.partA.consigneeTradeName && (
                  <div>
                    <div className="text-muted-foreground">Trade Name</div>
                    <div>{selectedBill.partA.consigneeTradeName}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">State</div>
                  <div>{selectedBill.partA.consigneeState}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Address</div>
                  <div>{selectedBill.partA.consigneeAddress}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Document Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Document Type</div>
                  <div className="font-medium">{selectedBill.partA.documentType}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Document Number</div>
                  <div className="font-mono">{selectedBill.partA.documentNumber}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Document Date</div>
                  <div>{format(new Date(selectedBill.partA.documentDate), 'dd MMM yyyy')}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Items</h3>
              <div className="space-y-3">
                {selectedBill.partA.items.map((item, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{item.description}</div>
                      <Badge variant="outline">HSN: {item.hsnCode}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Quantity</div>
                        <div>
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxable Value</div>
                        <div>₹{item.taxableValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tax Rates</div>
                        <div className="text-xs">
                          {item.cgstRate && `CGST: ${item.cgstRate}% `}
                          {item.sgstRate && `SGST: ${item.sgstRate}% `}
                          {item.igstRate && `IGST: ${item.igstRate}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-muted">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="text-xl font-bold">₹{selectedBill.partA.totalValue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Tax</div>
                  <div className="text-xl font-bold">₹{selectedBill.partA.totalTax.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Grand Total</div>
                  <div className="text-2xl font-bold">
                    ₹{(selectedBill.partA.totalValue + selectedBill.partA.totalTax).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Part B Tab */}
          <TabsContent value="part-b" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Transport Details</h3>
                {selectedBill.autoSynced ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    🔄 Auto-Synced
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    ⚠️ Manual Override
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Vehicle Number</div>
                  <div className="text-2xl font-mono font-bold">
                    {selectedBill.partB.vehicleNumber}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mode of Transport</div>
                  <div className="font-medium">{selectedBill.partB.modeOfTransport}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Transporter ID</div>
                  <div className="font-mono">{selectedBill.partB.transporterId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Transporter Name</div>
                  <div>{selectedBill.partB.transporterName || 'N/A'}</div>
                </div>
                {selectedBill.partB.transportDocumentNumber && (
                  <>
                    <div>
                      <div className="text-muted-foreground">Transport Doc Number</div>
                      <div>{selectedBill.partB.transportDocumentNumber}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Transport Doc Date</div>
                      <div>
                        {selectedBill.partB.transportDocumentDate &&
                          format(
                            new Date(selectedBill.partB.transportDocumentDate),
                            'dd MMM yyyy'
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Validity</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Valid From</div>
                  <div>{format(new Date(selectedBill.validFrom), 'dd MMM yyyy HH:mm')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Valid Until</div>
                  <div>{format(new Date(selectedBill.validUntil), 'dd MMM yyyy HH:mm')}</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No history available</p>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

                <div className="space-y-6">
                  {history.map((entry) => (
                    <div key={entry._id} className="relative pl-12">
                      {/* Timeline Dot */}
                      <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>

                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold capitalize">
                              {entry.eventType.replace(/-/g, ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {entry.updatedBy.name}
                          </Badge>
                        </div>

                        {entry.eventType === 'manual-update' && (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono bg-red-50 text-red-700 px-2 py-1 rounded">
                                {entry.oldVehicleNumber}
                              </span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono bg-green-50 text-green-700 px-2 py-1 rounded">
                                {entry.newVehicleNumber}
                              </span>
                            </div>

                            {entry.reason && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Reason:</span>{' '}
                                <span className="font-medium">{entry.reason}</span>
                              </div>
                            )}

                            {entry.notes && (
                              <div className="text-sm bg-muted p-2 rounded">
                                <span className="text-muted-foreground">Notes:</span> {entry.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {entry.eventType === 'auto-synced' && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Vehicle automatically synced from booking</span>
                          </div>
                        )}

                        {entry.eventType === 'creation' && (
                          <div className="text-sm text-muted-foreground mt-2">
                            E-way bill created with vehicle: {entry.newVehicleNumber}
                          </div>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
