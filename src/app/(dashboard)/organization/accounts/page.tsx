'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AccountsPage() {
  const accounts = [
    {
      _id: '1',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      accountHolderName: 'Cloudtruck Logistics Pvt Ltd',
      bankName: 'State Bank of India',
      branchName: 'Mumbai Main',
      accountType: 'Current',
      isPrimary: true,
      isActive: true,
    },
    {
      _id: '2',
      accountNumber: '9876543210',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Cloudtruck Logistics Pvt Ltd',
      bankName: 'HDFC Bank',
      branchName: 'Delhi Branch',
      accountType: 'Current',
      isPrimary: false,
      isActive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Accounts"
        description="Manage company bank accounts"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Holder</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>IFSC Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {account.accountHolderName}
                      {account.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      {account.accountNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.bankName}</div>
                      <div className="text-sm text-gray-500">{account.branchName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{account.ifscCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.accountType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      {!account.isPrimary && (
                        <Button variant="outline" size="sm">
                          Set Primary
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
