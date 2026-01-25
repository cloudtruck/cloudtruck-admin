'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Star, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAccounts } from '@/hooks/useAccounts';
import { useState } from 'react';
import { AddAccountModal } from '@/components/organization/AddAccountModal';
import { EditAccountModal } from '@/components/organization/EditAccountModal';
import type { Account } from '@/types';

export default function AccountsPage() {
  const { accounts, loading, setPrimaryAccount, refetch } = useAccounts();
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleSetPrimary = async (accountId: string) => {
    setSettingPrimary(accountId);
    await setPrimaryAccount(accountId);
    setSettingPrimary(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Accounts"
          description="Manage company bank accounts"
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Accounts"
        description="Manage company bank accounts"
        actions={<AddAccountModal onSuccess={refetch} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Accounts ({accounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first bank account</p>
              <AddAccountModal onSuccess={refetch} />
            </div>
          ) : (
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
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="font-mono">{account.accountNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.bankName}</div>
                        {account.branchName && (
                          <div className="text-sm text-gray-500">{account.branchName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{account.ifscCode}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {account.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingAccount(account)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {!account.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(account._id)}
                            disabled={settingPrimary === account._id}
                          >
                            {settingPrimary === account._id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Setting...
                              </>
                            ) : (
                              <>
                                <Star className="h-3 w-3 mr-1" />
                                Set Primary
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          open={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
