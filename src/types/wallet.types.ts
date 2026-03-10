export interface WalletTransaction {
  _id: string;
  driver: {
    _id: string;
    name: string;
    phone?: string;
  };
  type: 'advance' | 'balance' | 'payout' | 'adjustment';
  direction: 'credit' | 'debit';
  amount: number;
  runningBalance: number;
  title: string;
  subtitle: string;
  booking?: {
    _id: string;
    bookingId: string;
  };
  status: 'completed' | 'pending' | 'approved' | 'rejected';
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
    utrNumber?: string;
  };
  payoutNote?: string;
  note?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}
