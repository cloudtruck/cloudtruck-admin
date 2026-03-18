'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddBranchModal } from '@/components/organization/AddBranchModal';
import { AddEmployeeModal } from '@/components/organization/AddEmployeeModal';
import { AddAccountModal } from '@/components/organization/AddAccountModal';
import { EditEmployeeModal } from '@/components/organization/EditEmployeeModal';
import { EmployeeDetailDrawer } from '@/components/organization/EmployeeDetailDrawer';
import { AddLaneModal } from '@/components/organization/AddLaneModal';
import { EditLaneModal } from '@/components/organization/EditLaneModal';
import { useBranches } from '@/hooks/useBranches';
import { useEmployees } from '@/hooks/useEmployees';
import { useAccounts } from '@/hooks/useAccounts';
import { useMasterData } from '@/hooks/useMasterData';
import { useEmployeeStore } from '@/store/employeeStore';
import type { Staff, Branch, Account, MasterData } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pencil,
  XCircle,
  Plus,
  Search,
  ArrowUpDown,
  Filter,
  Inbox,
  Settings2,
  X,
} from 'lucide-react';

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = 'branches' | 'employees' | 'accounts' | 'address' | 'lane' | 'master';

const TABS: { key: Tab; label: string }[] = [
  { key: 'branches', label: 'Branches' },
  { key: 'employees', label: 'Employees' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'address', label: 'Address' },
  { key: 'lane', label: 'Lane' },
  { key: 'master', label: 'Master' },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none">
          {label}
        </span>
      )}
    </span>
  );
}

// ─── Coming Soon ──────────────────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="bg-white rounded border p-16 flex flex-col items-center gap-3 text-gray-400">
      <Inbox className="h-10 w-10 opacity-20" />
      <p className="text-sm">{label} — coming soon</p>
    </div>
  );
}

// ─── Accounts Tab ────────────────────────────────────────────────────────────

function AccountsTab({
  accounts,
  loading,
  onSetPrimary,
  onDelete,
}: {
  accounts: Account[];
  loading: boolean;
  onSetPrimary: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-white border-b">
            <TableHead className="text-xs font-semibold text-gray-600">Primary Account</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Action</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Beneficiary Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Bank Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Account No</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">IFSC No</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Branch Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Inbox className="h-8 w-8 opacity-30" />
                  <span className="text-sm">No data</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account._id} className="hover:bg-gray-50">
                {/* Primary Account toggle */}
                <TableCell className="py-2">
                  <button
                    onClick={() => onSetPrimary(account._id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                      ${
                        account.isPrimary
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                  >
                    {account.isPrimary && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                </TableCell>

                {/* Action */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    <Tooltip label="Edit">
                      <button className="text-blue-400 hover:text-blue-600 p-0.5">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <button
                        className="text-red-400 hover:text-red-600 p-0.5"
                        onClick={() => onDelete(account._id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-gray-800 font-medium">
                  {account.accountHolderName}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{account.bankName}</TableCell>
                <TableCell className="text-sm text-gray-700 font-mono tracking-wide">
                  {account.accountNumber ? `••••${account.accountNumber.slice(-4)}` : '—'}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{account.ifscCode || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{account.branchName || '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Address Tab ─────────────────────────────────────────────────────────────

interface OrgAddress {
  _id: string;
  name: string;
  address: string;
  accountNo?: string;
  gstin?: string;
  pan?: string;
  series?: string;
  isPrimary?: boolean;
}

function AddressTab({ addresses, loading }: { addresses: OrgAddress[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-white border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-16">Primary</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 w-20">Action</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Address</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Account No</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">GSTIN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">PAN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Series</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Inbox className="h-8 w-8 opacity-30" />
                  <span className="text-sm">No data</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            addresses.map((addr) => (
              <TableRow key={addr._id} className="hover:bg-gray-50">
                <TableCell className="py-2">
                  <button
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${addr.isPrimary ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    {addr.isPrimary && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    <Tooltip label="Edit">
                      <button className="text-blue-400 hover:text-blue-600 p-0.5">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <button className="text-red-400 hover:text-red-600 p-0.5">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-800">{addr.name}</TableCell>
                <TableCell className="text-sm text-gray-700 max-w-xs truncate">
                  {addr.address}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{addr.accountNo || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{addr.gstin || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{addr.pan || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{addr.series || '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Add Address Modal ────────────────────────────────────────────────────────

function AddAddressModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    accountNo: '',
    gstin: '',
    pan: '',
    series: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[520px]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Add Address</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          {[
            { label: 'Name', key: 'name', placeholder: 'Branch / Company name' },
            { label: 'GSTIN', key: 'gstin', placeholder: 'GST number' },
            { label: 'Address', key: 'address', placeholder: 'Full address', full: true },
            { label: 'PAN', key: 'pan', placeholder: 'PAN number' },
            { label: 'Account No', key: 'accountNo', placeholder: 'Bank account number' },
            { label: 'Series', key: 'series', placeholder: 'Booking series prefix' },
          ].map(({ label, key, placeholder, full }) => (
            <div key={key} className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <input
                className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onClose}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Lane Tab ─────────────────────────────────────────────────────────────────

function LaneTab({
  lanes,
  loading,
  locations,
  truckTypes,
  onEdit,
  onDelete,
}: {
  lanes: MasterData[];
  loading?: boolean;
  locations: MasterData[];
  truckTypes: MasterData[];
  onEdit: (lane: MasterData) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  const locationMap = Object.fromEntries(locations.map((l) => [l.key, l.displayName]));
  const truckTypeMap = Object.fromEntries(truckTypes.map((t) => [t.key, t.displayName]));

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-white border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-16">Actions</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1.5">
                Code
                <span className="text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none">
                  ↓
                </span>
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Short Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Source</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Destination</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Truck Type</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Customer Price</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Supplier Price</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Total KM</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Total Days</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lanes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Inbox className="h-8 w-8 opacity-30" />
                  <span className="text-sm">
                    No lanes yet. Click &quot;Add Lane&quot; to create one.
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            lanes.map((lane) => {
              const srcKey = lane.metadata?.sourceKey as string | undefined;
              const dstKey = lane.metadata?.destinationKey as string | undefined;
              const truckKey = lane.metadata?.truckType as string | undefined;
              const customerPrice = lane.metadata?.customerPrice as number | undefined;
              const supplierPrice = lane.metadata?.supplierPrice as number | undefined;
              const totalKm = lane.metadata?.totalKm as number | undefined;
              const totalDays = lane.metadata?.totalDays as number | undefined;

              return (
                <TableRow key={lane._id} className="hover:bg-gray-50">
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(lane)}
                        className="text-blue-400 hover:text-blue-600 p-0.5 rounded"
                        title="Edit lane"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete lane "${lane.displayName}"?`)) {
                            onDelete(lane._id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 p-0.5 rounded"
                        title="Delete lane"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">{lane.key}</TableCell>
                  <TableCell className="text-sm text-gray-700">{lane.displayName || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {srcKey ? locationMap[srcKey] || srcKey : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {dstKey ? locationMap[dstKey] || dstKey : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {truckKey ? truckTypeMap[truckKey] || truckKey : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {customerPrice != null ? `₹${customerPrice.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {supplierPrice != null ? `₹${supplierPrice.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {totalKm != null ? `${totalKm.toLocaleString()} km` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {totalDays != null ? `${totalDays}d` : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lane.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {lane.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Master Tab ───────────────────────────────────────────────────────────────

const ROLE_CHIPS = [
  'Supervisor',
  'Tracking',
  'Traffic',
  'Branch Tracking',
  'BM',
  'Fleet Admin',
  'Fleet Manager',
  'Operations',
];

function TagChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((item) => (
        <span
          key={item}
          className="border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 bg-white"
        >
          {item}
        </span>
      ))}
      <button className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function RoleChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (r: string) =>
    onChange(selected.includes(r) ? selected.filter((x) => x !== r) : [...selected, r]);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {ROLE_CHIPS.map((r) => (
        <button
          key={r}
          onClick={() => toggle(r)}
          className={`border rounded px-2 py-0.5 text-xs transition-colors
            ${selected.includes(r) ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-blue-300'}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function SettingRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-6 py-3.5 border-b last:border-0">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 flex items-center flex-wrap gap-2">{children}</div>
    </div>
  );
}

function MasterTab({
  materialTypes,
  truckTypes,
  chargeTypes,
}: {
  materialTypes: MasterData[];
  truckTypes: MasterData[];
  chargeTypes: MasterData[];
}) {
  const [noPodOwn, setNoPodOwn] = useState(false);
  const [noPodAttached, setNoPodAttached] = useState(false);
  const [noPodMarket, setNoPodMarket] = useState(false);
  const [serviceCharges, setServiceCharges] = useState(false);
  const [lrNo, setLrNo] = useState(true);
  const [lrImage, setLrImage] = useState(false);
  const [ewayBill, setEwayBill] = useState(false);
  const [exim, setExim] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(false);
  const [bmAccess, setBmAccess] = useState<'none' | 'read' | 'full'>('full');
  const [paymentMamul, setPaymentMamul] = useState<'none' | 'custom' | 'slab'>('none');
  const [docsEnable, setDocsEnable] = useState(false);
  const [processAdvance, setProcessAdvance] = useState(false);
  const [tripConfirm, setTripConfirm] = useState(false);
  const [supplierAdvance, setSupplierAdvance] = useState<'price' | 'percent'>('price');
  const [deleteTripTime, setDeleteTripTime] = useState<string[]>([]);
  const [deleteTrip, setDeleteTrip] = useState<string[]>([]);
  const [deleteLr, setDeleteLr] = useState<string[]>([]);
  const [kycDocsEnable, setKycDocsEnable] = useState(false);

  const chk = (checked: boolean, set: (v: boolean) => void) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => set(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
    />
  );

  const radio = <T extends string>(val: T, current: T, set: (v: T) => void, label: string) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
      <input
        type="radio"
        checked={current === val}
        onChange={() => set(val)}
        className="h-4 w-4 text-blue-600 cursor-pointer"
      />
      {label}
    </label>
  );

  const link = (label: string) => (
    <span key={label} className="text-blue-500 text-sm cursor-pointer hover:underline">
      {label}
    </span>
  );
  const linkRow = (labels: string[]) => (
    <div className="flex items-center gap-1 text-sm text-gray-400">
      {labels.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {link(l)}
          {i < labels.length - 1 && <span>/</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded border px-6 py-2">
      {/* Sources header */}
      <div className="flex py-3 border-b">
        <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-800">Sources</div>
        <div className="text-sm font-medium text-gray-800">Type</div>
      </div>

      <SettingRow label="Material Type">
        <TagChips
          items={materialTypes.filter((t) => t.isActive).map((t) => t.displayName.toUpperCase())}
        />
      </SettingRow>

      <SettingRow label="Truck Type">
        <TagChips
          items={truckTypes.filter((t) => t.isActive).map((t) => t.displayName.toUpperCase())}
        />
      </SettingRow>

      <SettingRow label="Charge Type">
        <TagChips
          items={chargeTypes.filter((t) => t.isActive).map((t) => t.displayName.toUpperCase())}
        />
      </SettingRow>

      <SettingRow label="No POD Applies to">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodOwn, setNoPodOwn)} Own
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodAttached, setNoPodAttached)} Attached
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodMarket, setNoPodMarket)} Market
        </label>
      </SettingRow>

      <SettingRow label="Service Charges">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(serviceCharges, setServiceCharges)} Enable
        </label>
      </SettingRow>

      <SettingRow label="Series Prefix" sub="Max upto 4 characters">
        <span className="text-sm font-semibold text-gray-800">SANTOSH MOVERS: SM</span>
        <button className="text-blue-400 hover:text-blue-600">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="LR" sub="Mandatory before source out - S-Out">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(lrNo, setLrNo)} LR No
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(lrImage, setLrImage)} LR Image
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(ewayBill, setEwayBill)} Eway Bill
        </label>
      </SettingRow>

      <SettingRow label="Partner Code">
        <button className="text-blue-400 hover:text-blue-600">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="EXIM" sub="Export / Import in Indent Creation">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(exim, setExim)} Allow Export / Import
        </label>
      </SettingRow>

      <SettingRow label="Customer Budget Limit">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(budgetLimit, setBudgetLimit)} Enable
        </label>
      </SettingRow>

      <SettingRow label="Addition Point Charge" sub="Charges for multipoint trips">
        <button className="text-blue-400 hover:text-blue-600">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="BM" sub="Accounts tab restriction for role BM">
        {radio('none', bmAccess, setBmAccess, 'No Access')}
        {radio('read', bmAccess, setBmAccess, 'Read Only')}
        {radio('full', bmAccess, setBmAccess, 'Full Access')}
      </SettingRow>

      <SettingRow label="PAYMENT Mamul" sub="In supplier advance deduction">
        {radio('none', paymentMamul, setPaymentMamul, 'No Deduction')}
        {radio('custom', paymentMamul, setPaymentMamul, 'Custom charges')}
        {radio('slab', paymentMamul, setPaymentMamul, 'Slab Based')}
      </SettingRow>

      <SettingRow label="Documents" sub="Mandatory before source out - S-Out">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(docsEnable, setDocsEnable)} Enable
        </label>
        {linkRow(['Truck', 'Driver', 'Supplier', 'Trip File'])}
      </SettingRow>

      <SettingRow label="Delete Trip Time" sub="S-in,S-out,D-in,D-out">
        <RoleChips selected={deleteTripTime} onChange={setDeleteTripTime} />
      </SettingRow>

      <SettingRow label="Process Supplier Advance" sub="after S-out">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(processAdvance, setProcessAdvance)} Enable
        </label>
      </SettingRow>

      <SettingRow label="Trip confirmation based on supplier type" sub="Truck Owner">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(tripConfirm, setTripConfirm)} Enable
        </label>
      </SettingRow>

      <SettingRow label="Lr Mandatory" sub="manual lr mandatory field">
        <button className="text-blue-400 hover:text-blue-600 border border-blue-200 rounded p-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </SettingRow>

      <SettingRow label="Supplier Advance Edit" sub="based on percentage or supplier price">
        {radio('price', supplierAdvance, setSupplierAdvance, 'Supplier Price Based')}
        {radio(
          'percent',
          supplierAdvance,
          setSupplierAdvance,
          "Supplier's configured advance percentage based"
        )}
      </SettingRow>

      <SettingRow label="Delete Trip" sub="Trip delete access before S-out">
        <RoleChips selected={deleteTrip} onChange={setDeleteTrip} />
      </SettingRow>

      <SettingRow label="Delete LR" sub="LR delete access">
        <RoleChips selected={deleteLr} onChange={setDeleteLr} />
      </SettingRow>

      <SettingRow label="Documents mandatory for KYC Approval">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(kycDocsEnable, setKycDocsEnable)} Enable
        </label>
        {linkRow(['Truck', 'Driver', 'Supplier'])}
      </SettingRow>

      <SettingRow label="Mandatory field for forms">
        {linkRow(['Truck', 'Supplier', 'Customer'])}
      </SettingRow>
    </div>
  );
}

// ─── Branch Manager Modal ────────────────────────────────────────────────────

function BranchManagerModal({
  branch,
  employees,
  onClose,
  onAssign,
}: {
  branch: Branch;
  employees: Staff[];
  onClose: () => void;
  onAssign: (branchId: string, staffId: string) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const currentManagers = branch.employees
    .map((e) => (typeof e === 'object' ? e : null))
    .filter(Boolean) as Staff[];

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await onAssign(branch._id, selected);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Branch Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Add Branch Manager</label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Branch Manager" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.name} {emp.role ? `(${emp.role})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <Button
                size="sm"
                className="self-end h-8 mt-1"
                onClick={handleAssign}
                disabled={saving}
              >
                {saving ? 'Assigning…' : 'Assign'}
              </Button>
            )}
          </div>

          {/* Current managers table */}
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <span className="text-xs font-semibold text-gray-600">Branch Manager</span>
            </div>
            {currentManagers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Inbox className="h-8 w-8 opacity-30" />
                <span className="text-sm">No data</span>
              </div>
            ) : (
              <div className="divide-y">
                {currentManagers.map((m) => (
                  <div key={m._id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Branches Tab ─────────────────────────────────────────────────────────────

function BranchesTab({
  branches,
  loading,
  employees,
  onAssign,
}: {
  branches: Branch[];
  loading: boolean;
  employees: Staff[];
  onAssign: (branchId: string, staffId: string) => Promise<boolean>;
}) {
  const [bmModal, setBmModal] = useState<Branch | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="text-xs font-semibold text-gray-600 w-16">
                <span className="flex items-center gap-1">
                  <Settings2 className="h-3.5 w-3.5" /> Action
                  <span className="ml-1 text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none cursor-pointer">
                    ↓
                  </span>
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">BM</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Cities</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Traffic</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Inbox className="h-8 w-8 opacity-30" />
                    <span className="text-sm">No branches yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => {
                const bm = typeof branch.branchManager === 'object' ? branch.branchManager : null;
                return (
                  <TableRow key={branch._id} className="hover:bg-gray-50">
                    <TableCell className="py-2">
                      <Tooltip label="Edit">
                        <button className="text-blue-400 hover:text-blue-600 p-0.5">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        {branch.branchName}
                        <Pencil className="h-3 w-3 text-blue-400" />
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">{bm?.name || '—'}</span>
                        <Tooltip label="Assign Branch Manager">
                          <button
                            onClick={() => setBmModal(branch)}
                            className="flex items-center justify-center h-5 w-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {branch.assignedCities?.length > 0 ? (
                          <>
                            {branch.assignedCities.slice(0, 3).map((city) => (
                              <span
                                key={city}
                                className="border rounded px-2 py-0.5 text-xs text-gray-700"
                              >
                                {city}
                              </span>
                            ))}
                            {branch.assignedCities.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{branch.assignedCities.length - 3}
                              </span>
                            )}
                            <button className="text-blue-400 hover:text-blue-600 p-0.5">
                              <Pencil className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        — <Pencil className="h-3 w-3 text-blue-400" />
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {bmModal && (
        <BranchManagerModal
          branch={bmModal}
          employees={employees}
          onClose={() => setBmModal(null)}
          onAssign={onAssign}
        />
      )}
    </>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesTab({
  employees,
  loading,
  pagination,
  onRefresh,
}: {
  employees: Staff[];
  loading: boolean;
  pagination: any;
  onRefresh: () => void;
}) {
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="text-xs font-semibold text-gray-600 w-16">
                <span className="flex items-center gap-1">
                  <Settings2 className="h-3.5 w-3.5" /> Action
                  <span className="ml-1 text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none cursor-pointer">
                    ↓
                  </span>
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <Search className="h-3 w-3 text-gray-400" /> Name
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <Search className="h-3 w-3 text-gray-400" /> Email
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <Search className="h-3 w-3 text-gray-400" /> Phone
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <Search className="h-3 w-3 text-gray-400" /> Role
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <Filter className="h-3 w-3 text-gray-400" /> Application Name
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Track Last Access
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Desk Last Access
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  Status <Filter className="h-3 w-3 text-gray-400" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Inbox className="h-8 w-8 opacity-30" />
                    <span className="text-sm">No employees found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp._id} className="hover:bg-gray-50">
                  {/* Action */}
                  <TableCell className="py-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Tooltip label="Edit">
                          <button
                            className="text-blue-400 hover:text-blue-600 p-0.5"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Deactivate">
                          <button className="text-red-400 hover:text-red-600 p-0.5">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="text-sm font-medium text-gray-800">{emp.name}</TableCell>

                  {/* Email */}
                  <TableCell className="text-sm text-gray-600">{emp.email || '—'}</TableCell>

                  {/* Phone */}
                  <TableCell className="text-sm text-gray-700">{emp.phone || '—'}</TableCell>

                  {/* Role */}
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-gray-700 capitalize">
                      {typeof emp.roleTemplate === 'object' && emp.roleTemplate !== null
                        ? (emp.roleTemplate as any).templateName
                        : emp.role}
                      <button className="text-blue-400 hover:text-blue-600">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </span>
                  </TableCell>

                  {/* Application Name */}
                  <TableCell className="text-sm text-gray-400">—</TableCell>

                  {/* Track Last Access */}
                  <TableCell className="text-sm text-gray-400">—</TableCell>

                  {/* Desk Last Access */}
                  <TableCell className="text-sm text-gray-400">—</TableCell>

                  {/* Status */}
                  <TableCell className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    {emp.status?.toUpperCase() || 'ACTIVE'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() =>
                  useEmployeeStore.setState((s) => ({
                    pagination: { ...s.pagination, currentPage: s.pagination.currentPage - 1 },
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() =>
                  useEmployeeStore.setState((s) => ({
                    pagination: { ...s.pagination, currentPage: s.pagination.currentPage + 1 },
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <>
          <EditEmployeeModal
            isOpen={editOpen}
            onClose={() => {
              setEditOpen(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
            onSuccess={onRefresh}
          />
          <EmployeeDetailDrawer
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
          />
        </>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganisationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('branches');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingLane, setEditingLane] = useState<MasterData | null>(null);

  const {
    branches,
    loading: branchesLoading,
    refetch: refetchBranches,
    assignEmployee,
  } = useBranches();
  const { employees, loading: employeesLoading, refetch: refetchEmployees } = useEmployees();
  const { accounts, loading: accountsLoading, setPrimaryAccount, deleteAccount } = useAccounts();
  const { data: materialTypes } = useMasterData('material-type');
  const { data: truckTypes } = useMasterData('truck-type');
  const { data: chargeTypes } = useMasterData('charge-type');
  const { data: locations } = useMasterData('location');
  const {
    data: lanes,
    loading: lanesLoading,
    refetch: refetchLanes,
    deleteItem: deleteLane,
  } = useMasterData('lane');
  const { pagination } = useEmployeeStore();

  const branchCount = branches.length;
  const employeeCount = pagination.totalItems || employees.length;

  const headerButton = () => {
    if (activeTab === 'branches') return <AddBranchModal />;
    if (activeTab === 'employees') return <AddEmployeeModal onSuccess={refetchEmployees} />;
    if (activeTab === 'accounts') return <AddAccountModal />;
    if (activeTab === 'address')
      return (
        <Button
          size="sm"
          className="h-8 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowAddAddress(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Address
        </Button>
      );
    if (activeTab === 'lane')
      return (
        <AddLaneModal
          locations={locations.filter((l) => l.isActive)}
          truckTypes={truckTypes.filter((t) => t.isActive)}
          onSuccess={refetchLanes}
        />
      );
    return null;
  };

  return (
    <div className="space-y-0">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        {/* Tabs */}
        <div className="flex items-end gap-0">
          {TABS.map((tab) => {
            const badge =
              tab.key === 'branches' ? branchCount : tab.key === 'employees' ? employeeCount : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5
                  ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                  }`}
              >
                {tab.label}
                {badge > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">{headerButton()}</div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="border-b mb-4" />

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {activeTab === 'branches' && (
        <BranchesTab
          branches={branches}
          loading={branchesLoading}
          employees={employees}
          onAssign={assignEmployee}
        />
      )}
      {activeTab === 'employees' && (
        <EmployeesTab
          employees={employees}
          loading={employeesLoading}
          pagination={pagination}
          onRefresh={refetchEmployees}
        />
      )}
      {activeTab === 'accounts' && (
        <AccountsTab
          accounts={accounts}
          loading={accountsLoading}
          onSetPrimary={setPrimaryAccount}
          onDelete={deleteAccount}
        />
      )}
      {activeTab === 'address' && (
        <>
          <AddressTab addresses={[]} />
          {showAddAddress && <AddAddressModal onClose={() => setShowAddAddress(false)} />}
        </>
      )}
      {activeTab === 'lane' && (
        <>
          <LaneTab
            lanes={lanes}
            loading={lanesLoading}
            locations={locations}
            truckTypes={truckTypes}
            onEdit={setEditingLane}
            onDelete={deleteLane}
          />
          {editingLane && (
            <EditLaneModal
              lane={editingLane}
              open={!!editingLane}
              locations={locations.filter((l) => l.isActive)}
              truckTypes={truckTypes.filter((t) => t.isActive)}
              onCloseAction={() => setEditingLane(null)}
              onSuccess={refetchLanes}
            />
          )}
        </>
      )}
      {activeTab === 'master' && (
        <MasterTab
          materialTypes={materialTypes}
          truckTypes={truckTypes}
          chargeTypes={chargeTypes}
        />
      )}
    </div>
  );
}
