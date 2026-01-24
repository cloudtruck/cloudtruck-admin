'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi, bookingApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateEwayBillRequest, PartADetails, PartBDetails } from '@/types';

interface CreateEwayBillModalProps {
  onSuccessAction: () => void;
}

export default function CreateEwayBillModal({ onSuccessAction }: CreateEwayBillModalProps) {
  const { createModalOpen, closeCreateModal, prefilledBookingId, addEwayBill } =
    useEwayBillStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<'consignor' | 'consignee' | null>(null);

  // Part A State
  const [partA, setPartA] = useState<Partial<PartADetails>>({
    consignorGSTIN: '',
    consignorLegalName: '',
    consignorTradeName: '',
    consignorAddress: '',
    consignorState: '',
    consigneeGSTIN: '',
    consigneeLegalName: '',
    consigneeTradeName: '',
    consigneeAddress: '',
    consigneeState: '',
    documentNumber: '',
    documentType: 'Invoice',
    documentDate: new Date().toISOString().split('T')[0],
    items: [
      {
        hsnCode: '',
        description: '',
        quantity: 0,
        unit: 'KGS',
        taxableValue: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
      },
    ],
    totalValue: 0,
    totalTax: 0,
  });

  // Part B State
  const [partB, setPartB] = useState<Partial<PartBDetails>>({
    vehicleNumber: '',
    transporterId: '',
    transporterName: '',
    modeOfTransport: 'Road',
    transportDocumentNumber: '',
    transportDocumentDate: '',
  });

  const [consignorVerified, setConsignorVerified] = useState(false);
  const [consigneeVerified, setConsigneeVerified] = useState(false);

  useEffect(() => {
    if (createModalOpen && prefilledBookingId) {
      fetchBookingData(prefilledBookingId);
    }
  }, [createModalOpen, prefilledBookingId]);

  const fetchBookingData = async (bookingId: string) => {
    try {
      const response = await bookingApi.getById(bookingId);
      if (response.data.success) {
        const booking = response.data.data;
        // Pre-fill from booking
        setPartA((prev) => ({
          ...prev,
          documentNumber: booking.bookingId,
          // You can add more pre-filling logic based on booking data
        }));
        if (booking.vehicle?.vehicleNumber) {
          const vNum = booking.vehicle.vehicleNumber;
          setPartB((prev) => ({
            ...prev,
            vehicleNumber: vNum,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    }
  };

  const handleVerifyGSTIN = async (type: 'consignor' | 'consignee') => {
    const gstin = type === 'consignor' ? partA.consignorGSTIN : partA.consigneeGSTIN;

    if (!gstin || gstin.length !== 15) {
      toast.error('Please enter a valid 15-digit GSTIN');
      return;
    }

    setVerifying(type);

    try {
      const response = await ewayBillApi.verifyGSTIN(gstin);
      if (response.data.success) {
        const data = response.data.data;
        if (type === 'consignor') {
          setPartA((prev) => ({
            ...prev,
            consignorLegalName: data.legalName,
            consignorTradeName: data.tradeName || '',
            consignorAddress: data.address,
            consignorState: data.state,
          }));
          setConsignorVerified(true);
          toast.success('Consignor GSTIN verified successfully');
        } else {
          setPartA((prev) => ({
            ...prev,
            consigneeLegalName: data.legalName,
            consigneeTradeName: data.tradeName || '',
            consigneeAddress: data.address,
            consigneeState: data.state,
          }));
          setConsigneeVerified(true);
          toast.success('Consignee GSTIN verified successfully');
        }
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'GSTIN verification failed';
      toast.error(errorMsg);
      if (type === 'consignor') {
        setConsignorVerified(false);
      } else {
        setConsigneeVerified(false);
      }
    } finally {
      setVerifying(null);
    }
  };

  const handleAddItem = () => {
    setPartA((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          hsnCode: '',
          description: '',
          quantity: 0,
          unit: 'KGS',
          taxableValue: 0,
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setPartA((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setPartA((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const calculateTotals = useCallback(() => {
    const items = partA.items || [];
    const totalValue = items.reduce((sum, item) => sum + (item.taxableValue || 0), 0);
    const totalTax = items.reduce((sum, item) => {
      const cgst = (item.taxableValue || 0) * ((item.cgstRate || 0) / 100);
      const sgst = (item.taxableValue || 0) * ((item.sgstRate || 0) / 100);
      const igst = (item.taxableValue || 0) * ((item.igstRate || 0) / 100);
      return sum + cgst + sgst + igst;
    }, 0);

    setPartA((prev) => ({ ...prev, totalValue, totalTax }));
  }, [partA.items]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleNext = () => {
    if (step === 1) {
      if (!consignorVerified || !consigneeVerified) {
        toast.error('Please verify both Consignor and Consignee GSTIN');
        return;
      }
      if (!partA.documentNumber || !partA.documentDate) {
        toast.error('Please fill all required fields in Part A');
        return;
      }
    }

    if (step === 2) {
      if (!partA.items || partA.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }
      const hasInvalidItem = partA.items.some(
        (item) => !item.hsnCode || !item.description || item.quantity <= 0
      );
      if (hasInvalidItem) {
        toast.error('Please fill all item details correctly');
        return;
      }
    }

    if (step === 3) {
      if (!partB.vehicleNumber || !partB.transporterId) {
        toast.error('Please fill all required fields in Part B');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const payload: CreateEwayBillRequest = {
        bookingId: prefilledBookingId,
        partA: partA as PartADetails,
        partB: partB as PartBDetails,
      };

      const response = await ewayBillApi.create(payload);
      if (response.data.success) {
        addEwayBill(response.data.data);
        toast.success('E-way bill created successfully');
        handleClose();
        onSuccessAction();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Failed to create E-way bill';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPartA({
      consignorGSTIN: '',
      consignorLegalName: '',
      consigneeGSTIN: '',
      consigneeLegalName: '',
      documentNumber: '',
      documentType: 'Invoice',
      documentDate: new Date().toISOString().split('T')[0],
      items: [
        {
          hsnCode: '',
          description: '',
          quantity: 0,
          unit: 'KGS',
          taxableValue: 0,
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
        },
      ],
      totalValue: 0,
      totalTax: 0,
    });
    setPartB({
      vehicleNumber: '',
      transporterId: '',
      modeOfTransport: 'Road',
    });
    setConsignorVerified(false);
    setConsigneeVerified(false);
    closeCreateModal();
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create E-way Bill - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Part A Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Part A: Document Details</h3>

              {/* Consignor */}
              <Card className="p-4 space-y-4">
                <h4 className="font-medium">Consignor (Sender)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>GSTIN *</Label>
                    <Input
                      placeholder="15-digit GSTIN"
                      value={partA.consignorGSTIN}
                      onChange={(e) =>
                        setPartA({ ...partA, consignorGSTIN: e.target.value.toUpperCase() })
                      }
                      maxLength={15}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => handleVerifyGSTIN('consignor')}
                      disabled={verifying === 'consignor' || consignorVerified}
                      className="w-full"
                    >
                      {verifying === 'consignor' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : consignorVerified ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Verified
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </div>
                {consignorVerified && (
                  <div className="space-y-2">
                    <div>
                      <Label>Legal Name</Label>
                      <Input value={partA.consignorLegalName} disabled />
                    </div>
                    <div>
                      <Label>Trade Name</Label>
                      <Input value={partA.consignorTradeName || 'N/A'} disabled />
                    </div>
                  </div>
                )}
              </Card>

              {/* Consignee */}
              <Card className="p-4 space-y-4">
                <h4 className="font-medium">Consignee (Receiver)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>GSTIN *</Label>
                    <Input
                      placeholder="15-digit GSTIN"
                      value={partA.consigneeGSTIN}
                      onChange={(e) =>
                        setPartA({ ...partA, consigneeGSTIN: e.target.value.toUpperCase() })
                      }
                      maxLength={15}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => handleVerifyGSTIN('consignee')}
                      disabled={verifying === 'consignee' || consigneeVerified}
                      className="w-full"
                    >
                      {verifying === 'consignee' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : consigneeVerified ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Verified
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </div>
                {consigneeVerified && (
                  <div className="space-y-2">
                    <div>
                      <Label>Legal Name</Label>
                      <Input value={partA.consigneeLegalName} disabled />
                    </div>
                    <div>
                      <Label>Trade Name</Label>
                      <Input value={partA.consigneeTradeName || 'N/A'} disabled />
                    </div>
                  </div>
                )}
              </Card>

              {/* Document Details */}
              <Card className="p-4 space-y-4">
                <h4 className="font-medium">Document Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Document Type *</Label>
                    <Select
                      value={partA.documentType}
                      onValueChange={(value) => setPartA({ ...partA, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Bill of Supply">Bill of Supply</SelectItem>
                        <SelectItem value="Delivery Challan">Delivery Challan</SelectItem>
                        <SelectItem value="Bill of Entry">Bill of Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Document Number *</Label>
                    <Input
                      placeholder="Document/Invoice Number"
                      value={partA.documentNumber}
                      onChange={(e) => setPartA({ ...partA, documentNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Document Date *</Label>
                    <Input
                      type="date"
                      value={partA.documentDate}
                      onChange={(e) => setPartA({ ...partA, documentDate: e.target.value })}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Items */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Item List</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {partA.items?.map((item, index) => (
                <Card key={index} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {partA.items && partA.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>HSN Code *</Label>
                      <Input
                        placeholder="8-digit HSN Code"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description *</Label>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>Unit *</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) => handleItemChange(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KGS">KGS</SelectItem>
                          <SelectItem value="TON">TON</SelectItem>
                          <SelectItem value="NOS">NOS</SelectItem>
                          <SelectItem value="MTR">MTR</SelectItem>
                          <SelectItem value="BOX">BOX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Taxable Value *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.taxableValue || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'taxableValue', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>CGST Rate (%)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.cgstRate || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'cgstRate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>SGST Rate (%)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.sgstRate || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'sgstRate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>IGST Rate (%)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.igstRate || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'igstRate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-4 bg-muted">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                    <div className="text-2xl font-bold">₹{partA.totalValue?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Tax</div>
                    <div className="text-2xl font-bold">₹{partA.totalTax?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Grand Total</div>
                    <div className="text-2xl font-bold">
                      ₹{((partA.totalValue || 0) + (partA.totalTax || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Part B */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Part B: Vehicle & Transporter Details</h3>

              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle Number *</Label>
                    <Input
                      placeholder="MH01AB1234"
                      value={partB.vehicleNumber}
                      onChange={(e) =>
                        setPartB({ ...partB, vehicleNumber: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div>
                    <Label>Mode of Transport *</Label>
                    <Select
                      value={partB.modeOfTransport}
                      onValueChange={(value) => setPartB({ ...partB, modeOfTransport: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Road">Road</SelectItem>
                        <SelectItem value="Rail">Rail</SelectItem>
                        <SelectItem value="Air">Air</SelectItem>
                        <SelectItem value="Ship">Ship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Transporter ID *</Label>
                    <Input
                      placeholder="Transporter GSTIN"
                      value={partB.transporterId}
                      onChange={(e) =>
                        setPartB({ ...partB, transporterId: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div>
                    <Label>Transporter Name</Label>
                    <Input
                      placeholder="Transporter Name"
                      value={partB.transporterName}
                      onChange={(e) => setPartB({ ...partB, transporterName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Transport Document Number</Label>
                    <Input
                      placeholder="LR/Bill Number"
                      value={partB.transportDocumentNumber}
                      onChange={(e) =>
                        setPartB({ ...partB, transportDocumentNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Transport Document Date</Label>
                    <Input
                      type="date"
                      value={partB.transportDocumentDate}
                      onChange={(e) =>
                        setPartB({ ...partB, transportDocumentDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review & Submit</h3>

              <Card className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Part A: Document Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consignor:</span>
                      <span>{partA.consignorLegalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consignee:</span>
                      <span>{partA.consigneeLegalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document:</span>
                      <span>
                        {partA.documentType} - {partA.documentNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{partA.items?.length}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Value:</span>
                      <span>₹{partA.totalValue?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Part B: Transport Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Number:</span>
                      <span className="font-mono">{partB.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode:</span>
                      <span>{partB.modeOfTransport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transporter:</span>
                      <span>{partB.transporterName || partB.transporterId}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create E-way Bill'
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
