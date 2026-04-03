'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddBranchModal } from '@/components/organization/AddBranchModal';
import { AddEmployeeModal } from '@/components/organization/AddEmployeeModal';
import { AddAccountModal } from '@/components/organization/AddAccountModal';
import { EditAccountModal } from '@/components/organization/EditAccountModal';
import { EditEmployeeModal } from '@/components/organization/EditEmployeeModal';
import { EmployeeDetailDrawer } from '@/components/organization/EmployeeDetailDrawer';
import { AddLaneModal } from '@/components/organization/AddLaneModal';
import { EditLaneModal } from '@/components/organization/EditLaneModal';
import { EditAddressModal } from '@/components/organization/EditAddressModal';
import { EditBranchModal } from '@/components/organization/EditBranchModal';
import { AddMasterDataModal } from '@/components/organization/AddMasterDataModal';
import { useBranches } from '@/hooks/useBranches';
import { useEmployees } from '@/hooks/useEmployees';
import { useAccounts } from '@/hooks/useAccounts';
import { useAddress } from '@/hooks/useAddress';
import { useMasterData } from '@/hooks/useMasterData';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useDeleteRequests } from '@/hooks/useDeleteRequests';
import { useEmployeeStore } from '@/store/employeeStore';
import type { Staff, Branch, Account, MasterData, OrgAddress, RoleTemplate } from '@/types';
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
  Trash2,
  Plus,
  Search,
  ArrowUpDown,
  Filter,
  Inbox,
  Settings2,
  X,
} from 'lucide-react';
import { DeleteRequestQueue } from '@/components/organization/DeleteRequestQueue';
import { DeleteRequestModal } from '@/components/organization/DeleteRequestModal';
import { EditSettingModal } from '@/components/organization/EditSettingModal';

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
  onEdit,
  onSetPrimary,
  onDelete,
}: {
  accounts: Account[];
  loading: boolean;
  onEdit: (account: Account) => void;
  onSetPrimary: (id: string) => Promise<boolean>;
  onDelete: (id: string) => void;
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
                      <button
                        className="text-blue-400 hover:text-blue-600 p-0.5"
                        onClick={() => onEdit(account)}
                      >
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

function AddressTab({
  addresses,
  loading,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  addresses: OrgAddress[];
  loading?: boolean;
  onEdit: (addr: OrgAddress) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
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
                    onClick={() => onSetPrimary(addr._id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${addr.isPrimary ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    {addr.isPrimary && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    <Tooltip label="Edit">
                      <button
                        className="text-blue-400 hover:text-blue-600 p-0.5"
                        onClick={() => onEdit(addr)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <button
                        className="text-red-400 hover:text-red-600 p-0.5"
                        onClick={() => onDelete(addr._id)}
                      >
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

function AddAddressModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<OrgAddress, '_id' | 'isPrimary' | 'isActive'>) => Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.address || !form.city || !form.state || !form.pincode) return;
    setSaving(true);
    const ok = await onSubmit({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      gstin: form.gstin || undefined,
      pan: form.pan || undefined,
    });
    setSaving(false);
    if (ok) onClose();
  };

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
            { label: 'Name *', key: 'name', placeholder: 'Branch / Company name' },
            { label: 'GSTIN', key: 'gstin', placeholder: 'GST number' },
            { label: 'Address *', key: 'address', placeholder: 'Full address', full: true },
            { label: 'City *', key: 'city', placeholder: 'City' },
            { label: 'State *', key: 'state', placeholder: 'State' },
            { label: 'Pincode *', key: 'pincode', placeholder: '6-digit pincode' },
            { label: 'PAN', key: 'pan', placeholder: 'PAN number' },
          ].map(({ label, key, placeholder, full }) => (
            <div key={key} className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <input
                className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={
              saving || !form.name || !form.address || !form.city || !form.state || !form.pincode
            }
          >
            {saving ? 'Saving…' : 'Save'}
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

function TagChips({ items, onAdd }: { items: string[]; onAdd?: () => void }) {
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
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
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

const DOC_FOR_OPTIONS = ['Truck', 'Driver', 'Supplier', 'Trip File'] as const;
const KYC_FOR_OPTIONS = ['Truck', 'Driver', 'Supplier'] as const;

function MasterTab({
  materialTypes,
  truckTypes,
  chargeTypes,
  onRefreshMaster,
}: {
  materialTypes: MasterData[];
  truckTypes: MasterData[];
  chargeTypes: MasterData[];
  onRefreshMaster: () => void;
}) {
  const { settings, updateSettings, updateBookingConfig } = useOrganizationSettings();

  // Track the last settings.updatedAt that was applied to local state.
  // Using updatedAt (not _id) allows re-sync if a save fails and settings refresh.
  const syncedAtRef = useRef<string | null>(null);

  // ── Local state ───────────────────────────────────────────────────────────
  // noPodOwn is inverted: checked = podMandatory false (no POD required for own trucks)
  const [noPodOwn, setNoPodOwn] = useState(false);
  const [noPodAttached, setNoPodAttached] = useState(false);
  const [noPodMarket, setNoPodMarket] = useState(false);
  const [serviceCharges, setServiceCharges] = useState(false);
  // Single object avoids stale-closure race when multiple LR checkboxes are clicked rapidly
  const [lrMandatoryState, setLrMandatoryState] = useState({
    lrNo: true,
    lrImage: false,
    ewayBill: false,
  });
  const [exim, setExim] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(false);
  const [bmAccess, setBmAccess] = useState<'none' | 'read' | 'full'>('full');
  const [paymentMamul, setPaymentMamul] = useState<'none' | 'custom' | 'slab'>('none');
  const [docsEnable, setDocsEnable] = useState(false);
  const [docsMandatoryFor, setDocsMandatoryFor] = useState<string[]>([]);
  const [advancePercentage, setAdvancePercentage] = useState<string>('');
  const [processAdvance, setProcessAdvance] = useState(false);
  const [tripConfirm, setTripConfirm] = useState(false);
  const [supplierAdvance, setSupplierAdvance] = useState<'price' | 'percent'>('price');
  const [deleteTripTime, setDeleteTripTime] = useState<string[]>([]);
  const [deleteTrip, setDeleteTrip] = useState<string[]>([]);
  const [deleteLr, setDeleteLr] = useState<string[]>([]);
  const [kycDocsEnable, setKycDocsEnable] = useState(false);
  const [kycDocsMandatoryFor, setKycDocsMandatoryFor] = useState<string[]>([]);

  // Edit modal open state
  const [editSeriesOpen, setEditSeriesOpen] = useState(false);
  const [editPartnerOpen, setEditPartnerOpen] = useState(false);
  const [editPointChargeOpen, setEditPointChargeOpen] = useState(false);

  // Add master data modal
  const [addMasterCategory, setAddMasterCategory] = useState<MasterData['category'] | null>(null);

  // ── Sync local state from settings ───────────────────────────────────────
  // Runs whenever updatedAt changes (initial load or successful save).
  // Using updatedAt (not _id) allows re-sync after a failed save once the
  // server returns fresh data, without reverting in-flight user edits.
  useEffect(() => {
    if (!settings?.updatedAt || syncedAtRef.current === settings.updatedAt) return;
    syncedAtRef.current = settings.updatedAt;

    setNoPodOwn(settings.podMandatory === false);
    setNoPodAttached(settings.noPodAttached ?? false);
    setNoPodMarket(settings.noPodMarket ?? false);
    setServiceCharges(settings.serviceChargesEnabled ?? false);
    setLrMandatoryState({
      lrNo: settings.lrMandatory?.lrNo ?? true,
      lrImage: settings.lrMandatory?.lrImage ?? false,
      ewayBill: settings.lrMandatory?.ewayBill ?? false,
    });
    setExim(settings.eximEnabled ?? false);
    setBudgetLimit(settings.customerBudgetLimitEnabled ?? false);
    setBmAccess(settings.bmAccess ?? 'full');
    setPaymentMamul(settings.paymentMamul ?? 'none');
    setDocsEnable(settings.documentsMandatory ?? false);
    setDocsMandatoryFor(settings.documentsMandatoryFor ?? []);
    setAdvancePercentage(String(settings.advancePaymentPercentage ?? ''));
    setProcessAdvance(settings.processSupplierAdvance ?? false);
    setTripConfirm(settings.tripConfirmationEnabled ?? false);
    setSupplierAdvance(settings.supplierAdvanceEditMode ?? 'price');
    setDeleteTripTime(settings.deleteTripTimeRoles ?? []);
    setDeleteTrip(settings.deleteTripRoles ?? []);
    setDeleteLr(settings.deleteLrRoles ?? []);
    setKycDocsEnable(settings.kycDocsMandatoryEnabled ?? false);
    setKycDocsMandatoryFor(settings.kycDocsMandatoryFor ?? []);
  }, [settings?.updatedAt]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const chk = (checked: boolean, onChange: (v: boolean) => void) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
    />
  );

  const radio = <T extends string>(val: T, current: T, onChange: (v: T) => void, label: string) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
      <input
        type="radio"
        checked={current === val}
        onChange={() => onChange(val)}
        className="h-4 w-4 text-blue-600 cursor-pointer"
      />
      {label}
    </label>
  );

  const toggleArrayItem = (
    opt: string,
    current: string[],
    setter: (v: string[]) => void,
    key: 'documentsMandatoryFor' | 'kycDocsMandatoryFor'
  ) => {
    const next = current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt];
    setter(next);
    updateSettings({ [key]: next });
  };

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
          onAdd={() => setAddMasterCategory('material-type')}
        />
      </SettingRow>

      <SettingRow label="Truck Type">
        <TagChips
          items={truckTypes.filter((t) => t.isActive).map((t) => t.displayName.toUpperCase())}
          onAdd={() => setAddMasterCategory('truck-type')}
        />
      </SettingRow>

      <SettingRow label="Charge Type">
        <TagChips
          items={chargeTypes.filter((t) => t.isActive).map((t) => t.displayName.toUpperCase())}
          onAdd={() => setAddMasterCategory('charge-type')}
        />
      </SettingRow>

      <SettingRow label="No POD Applies to">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodOwn, (v) => {
            setNoPodOwn(v);
            // noPodOwn checked = POD not mandatory for own trucks
            updateSettings({ podMandatory: !v });
          })}{' '}
          Own
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodAttached, (v) => {
            setNoPodAttached(v);
            updateSettings({ noPodAttached: v });
          })}{' '}
          Attached
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(noPodMarket, (v) => {
            setNoPodMarket(v);
            updateSettings({ noPodMarket: v });
          })}{' '}
          Market
        </label>
      </SettingRow>

      <SettingRow label="Service Charges">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(serviceCharges, (v) => {
            setServiceCharges(v);
            updateSettings({ serviceChargesEnabled: v });
          })}{' '}
          Enable
        </label>
      </SettingRow>

      <SettingRow label="Series Prefix" sub="Max upto 4 characters">
        <span className="text-sm font-semibold text-gray-800">
          {settings?.companyName
            ? `${settings.companyName}: ${settings.bookingSeriesPrefix || ''}`
            : '—'}
        </span>
        <button
          onClick={() => setEditSeriesOpen(true)}
          className="text-blue-400 hover:text-blue-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="LR" sub="Mandatory before source out - S-Out">
        {(['lrNo', 'lrImage', 'ewayBill'] as const).map((field) => {
          const labels: Record<string, string> = {
            lrNo: 'LR No',
            lrImage: 'LR Image',
            ewayBill: 'Eway Bill',
          };
          return (
            <label
              key={field}
              className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
            >
              {chk(lrMandatoryState[field], (v) => {
                // Use functional update to always read fresh state, avoiding stale closure
                const next = { ...lrMandatoryState, [field]: v };
                setLrMandatoryState(next);
                updateSettings({ lrMandatory: next });
              })}{' '}
              {labels[field]}
            </label>
          );
        })}
      </SettingRow>

      <SettingRow label="Partner Code">
        <span className="text-sm text-gray-700">{settings?.partnerCode || '—'}</span>
        <button
          onClick={() => setEditPartnerOpen(true)}
          className="text-blue-400 hover:text-blue-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="EXIM" sub="Export / Import in Indent Creation">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(exim, (v) => {
            setExim(v);
            updateSettings({ eximEnabled: v });
          })}{' '}
          Allow Export / Import
        </label>
      </SettingRow>

      <SettingRow label="Customer Budget Limit">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(budgetLimit, (v) => {
            setBudgetLimit(v);
            updateSettings({ customerBudgetLimitEnabled: v });
          })}{' '}
          Enable
        </label>
      </SettingRow>

      <SettingRow label="Addition Point Charge" sub="Charges for multipoint trips">
        <span className="text-sm text-gray-700">
          {settings?.additionPointCharge ? `₹${settings.additionPointCharge}` : '—'}
        </span>
        <button
          onClick={() => setEditPointChargeOpen(true)}
          className="text-blue-400 hover:text-blue-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </SettingRow>

      <SettingRow label="BM" sub="Accounts tab restriction for role BM">
        {radio(
          'none',
          bmAccess,
          (v) => {
            setBmAccess(v);
            updateSettings({ bmAccess: v });
          },
          'No Access'
        )}
        {radio(
          'read',
          bmAccess,
          (v) => {
            setBmAccess(v);
            updateSettings({ bmAccess: v });
          },
          'Read Only'
        )}
        {radio(
          'full',
          bmAccess,
          (v) => {
            setBmAccess(v);
            updateSettings({ bmAccess: v });
          },
          'Full Access'
        )}
      </SettingRow>

      <SettingRow label="PAYMENT Mamul" sub="In supplier advance deduction">
        {radio(
          'none',
          paymentMamul,
          (v) => {
            setPaymentMamul(v);
            updateSettings({ paymentMamul: v });
          },
          'No Deduction'
        )}
        {radio(
          'custom',
          paymentMamul,
          (v) => {
            setPaymentMamul(v);
            updateSettings({ paymentMamul: v });
          },
          'Custom charges'
        )}
        {radio(
          'slab',
          paymentMamul,
          (v) => {
            setPaymentMamul(v);
            updateSettings({ paymentMamul: v });
          },
          'Slab Based'
        )}
      </SettingRow>

      <SettingRow label="Documents" sub="Mandatory before source out - S-Out">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(docsEnable, (v) => {
            setDocsEnable(v);
            updateSettings({ documentsMandatory: v });
          })}{' '}
          Enable
        </label>
        <div className="flex flex-wrap gap-2">
          {DOC_FOR_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={docsMandatoryFor.includes(opt)}
                onChange={() =>
                  toggleArrayItem(
                    opt,
                    docsMandatoryFor,
                    setDocsMandatoryFor,
                    'documentsMandatoryFor'
                  )
                }
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Delete Trip Time" sub="S-in,S-out,D-in,D-out">
        <RoleChips
          selected={deleteTripTime}
          onChange={(v) => {
            setDeleteTripTime(v);
            updateSettings({ deleteTripTimeRoles: v });
          }}
        />
      </SettingRow>

      <SettingRow label="Process Supplier Advance" sub="after S-out">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(processAdvance, (v) => {
            setProcessAdvance(v);
            updateSettings({ processSupplierAdvance: v });
          })}{' '}
          Enable
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={100}
            value={advancePercentage}
            disabled={!processAdvance}
            onChange={(e) => setAdvancePercentage(e.target.value)}
            onBlur={() => {
              if (!processAdvance) return;
              const val = parseFloat(advancePercentage);
              if (!isNaN(val)) updateSettings({ advancePaymentPercentage: val });
            }}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            placeholder="0"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </SettingRow>

      <SettingRow label="Trip confirmation based on supplier type" sub="Truck Owner">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(tripConfirm, (v) => {
            setTripConfirm(v);
            updateSettings({ tripConfirmationEnabled: v });
          })}{' '}
          Enable
        </label>
      </SettingRow>

      <SettingRow label="Supplier Advance Edit" sub="based on percentage or supplier price">
        {radio(
          'price',
          supplierAdvance,
          (v) => {
            setSupplierAdvance(v);
            updateSettings({ supplierAdvanceEditMode: v });
          },
          'Supplier Price Based'
        )}
        {radio(
          'percent',
          supplierAdvance,
          (v) => {
            setSupplierAdvance(v);
            updateSettings({ supplierAdvanceEditMode: v });
          },
          "Supplier's configured advance percentage based"
        )}
      </SettingRow>

      <SettingRow label="Delete Trip" sub="Trip delete access before S-out">
        <RoleChips
          selected={deleteTrip}
          onChange={(v) => {
            setDeleteTrip(v);
            updateSettings({ deleteTripRoles: v });
          }}
        />
      </SettingRow>

      <SettingRow label="Delete LR" sub="LR delete access">
        <RoleChips
          selected={deleteLr}
          onChange={(v) => {
            setDeleteLr(v);
            updateSettings({ deleteLrRoles: v });
          }}
        />
      </SettingRow>

      <SettingRow label="Documents mandatory for KYC Approval">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          {chk(kycDocsEnable, (v) => {
            setKycDocsEnable(v);
            updateSettings({ kycDocsMandatoryEnabled: v });
          })}{' '}
          Enable
        </label>
        <div className="flex flex-wrap gap-2">
          {KYC_FOR_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={kycDocsMandatoryFor.includes(opt)}
                onChange={() =>
                  toggleArrayItem(
                    opt,
                    kycDocsMandatoryFor,
                    setKycDocsMandatoryFor,
                    'kycDocsMandatoryFor'
                  )
                }
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Mandatory field for forms">
        <div className="flex items-center gap-1 text-sm text-gray-400">
          {['Truck', 'Supplier', 'Customer'].map((l, i, arr) => (
            <span key={l} className="flex items-center gap-1">
              <span className="text-blue-400 opacity-50 cursor-not-allowed">{l}</span>
              {i < arr.length - 1 && <span>/</span>}
            </span>
          ))}
          <span className="text-xs ml-1">(coming soon)</span>
        </div>
      </SettingRow>

      {/* Delete Request Approvals Queue */}
      <div className="py-4 border-t mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Pending Delete Approvals</h3>
        <DeleteRequestQueue />
      </div>

      {/* ── Edit Modals ──────────────────────────────────────────────────── */}
      <EditSettingModal
        open={editSeriesOpen}
        onClose={() => setEditSeriesOpen(false)}
        title="Edit Series Prefix"
        label="Prefix (max 4 characters)"
        value={settings?.bookingSeriesPrefix ?? ''}
        inputType="text"
        maxLength={4}
        placeholder="e.g. BK"
        hint="Uppercase letters only, max 4 characters"
        transform={(v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')}
        onSave={(v) => updateBookingConfig({ bookingSeriesPrefix: v })}
      />

      <EditSettingModal
        open={editPartnerOpen}
        onClose={() => setEditPartnerOpen(false)}
        title="Edit Partner Code"
        label="Partner Code"
        value={settings?.partnerCode ?? ''}
        inputType="text"
        placeholder="Enter partner code"
        onSave={(v) => updateSettings({ partnerCode: v.trim() })}
      />

      <EditSettingModal
        open={editPointChargeOpen}
        onClose={() => setEditPointChargeOpen(false)}
        title="Edit Addition Point Charge"
        label="Charge amount (₹)"
        value={settings?.additionPointCharge ?? 0}
        inputType="number"
        min={0}
        placeholder="0"
        hint="Flat charge added for each additional trip point"
        onSave={(v) => updateSettings({ additionPointCharge: parseFloat(v) })}
      />

      {addMasterCategory && (
        <AddMasterDataModal
          category={addMasterCategory}
          categoryLabel={
            addMasterCategory === 'material-type'
              ? 'Material Type'
              : addMasterCategory === 'truck-type'
                ? 'Truck Type'
                : 'Charge Type'
          }
          open={true}
          onOpenChange={(v) => {
            if (!v) setAddMasterCategory(null);
          }}
          onSuccess={() => {
            setAddMasterCategory(null);
            onRefreshMaster();
          }}
        />
      )}
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

  const currentBM =
    branch.branchManager && typeof branch.branchManager === 'object'
      ? (branch.branchManager as Staff)
      : null;

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
          <h2 className="text-base font-semibold text-gray-900">Assign Branch Manager</h2>
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

          {/* Current branch manager */}
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <span className="text-xs font-semibold text-gray-600">Current Branch Manager</span>
            </div>
            {!currentBM ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Inbox className="h-8 w-8 opacity-30" />
                <span className="text-sm">No branch manager assigned</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentBM.name}</p>
                  <p className="text-xs text-gray-500">{currentBM.email}</p>
                </div>
                <span className="text-xs text-green-600 font-medium capitalize">
                  {currentBM.role}
                </span>
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
  onEdit,
  onDelete,
  onSetTraffic,
}: {
  branches: Branch[];
  loading: boolean;
  employees: Staff[];
  onAssign: (branchId: string, staffId: string) => Promise<boolean>;
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
  onSetTraffic: (branch: Branch) => void;
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
                  <span className="ml-1 text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none">
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
                      <div className="flex items-center gap-1">
                        <Tooltip label="Edit">
                          <button
                            className="text-blue-400 hover:text-blue-600 p-0.5"
                            onClick={() => onEdit(branch)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <button
                            className="text-red-400 hover:text-red-600 p-0.5"
                            onClick={() => onDelete(branch._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-800">{branch.branchName}</span>
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
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        {(() => {
                          const tc = (branch as Branch & { trafficCoordinator?: Staff | string })
                            .trafficCoordinator;
                          return typeof tc === 'object' && tc ? (tc as Staff).name : '—';
                        })()}
                        <button
                          className="text-blue-400 hover:text-blue-600 p-0.5"
                          onClick={() => onSetTraffic(branch)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
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
  onDeactivate,
}: {
  employees: Staff[];
  loading: boolean;
  pagination: any;
  onRefresh: () => void;
  onDeactivate: (id: string) => Promise<void>;
}) {
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

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
                  <span className="ml-1 text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none">
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
                  Status <Filter className="h-3 w-3 text-gray-400" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
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
                        <Tooltip label={emp.status === 'inactive' ? 'Activate' : 'Deactivate'}>
                          <button
                            className="text-red-400 hover:text-red-600 p-0.5 disabled:opacity-40"
                            disabled={deactivating === emp._id}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `${emp.status === 'inactive' ? 'Activate' : 'Deactivate'} employee "${emp.name}"?`
                                )
                              )
                                return;
                              setDeactivating(emp._id);
                              await onDeactivate(emp._id);
                              setDeactivating(null);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell
                    className="text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setDrawerOpen(true);
                    }}
                  >
                    {emp.name}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-sm text-gray-600">{emp.email || '—'}</TableCell>

                  {/* Phone */}
                  <TableCell className="text-sm text-gray-700">{emp.phone || '—'}</TableCell>

                  {/* Role */}
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-gray-700 capitalize">
                      {typeof emp.roleTemplate === 'object' && emp.roleTemplate !== null
                        ? (emp.roleTemplate as RoleTemplate).templateName
                        : emp.role}
                      <button
                        className="text-blue-400 hover:text-blue-600"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </span>
                  </TableCell>

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

// ─── Traffic Coordinator Modal ────────────────────────────────────────────────

function TrafficCoordinatorModal({
  branch,
  employees,
  onClose,
  onAssign,
  refetch,
}: {
  branch: Branch;
  employees: Staff[];
  onClose: () => void;
  onAssign: (branchId: string, staffId: string) => Promise<boolean>;
  refetch: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const tc = (branch as Branch & { trafficCoordinator?: Staff | string }).trafficCoordinator;
  const currentTC = typeof tc === 'object' && tc ? (tc as Staff) : null;

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await onAssign(branch._id, selected);
    setSaving(false);
    if (ok) {
      refetch();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Assign Traffic Coordinator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Select Employee</label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Traffic Coordinator" />
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
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <span className="text-xs font-semibold text-gray-600">
                Current Traffic Coordinator
              </span>
            </div>
            {!currentTC ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                <Inbox className="h-8 w-8 opacity-30" />
                <span className="text-sm">No traffic coordinator assigned</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentTC.name}</p>
                  <p className="text-xs text-gray-500">{currentTC.email}</p>
                </div>
                <span className="text-xs text-green-600 font-medium capitalize">
                  {currentTC.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganisationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('branches');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingLane, setEditingLane] = useState<MasterData | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingAddress, setEditingAddress] = useState<OrgAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: string;
    model: string;
    name: string;
  } | null>(null);
  const [trafficBranch, setTrafficBranch] = useState<Branch | null>(null);

  const {
    branches,
    loading: branchesLoading,
    refetch: refetchBranches,
    assignEmployee,
    updateBranch,
    deleteBranch,
    setBranchManager,
    setTrafficCoordinator,
  } = useBranches();
  const {
    employees,
    loading: employeesLoading,
    refetch: refetchEmployees,
    updateEmployee,
  } = useEmployees();
  const { accounts, loading: accountsLoading, setPrimaryAccount, updateAccount } = useAccounts();
  const {
    addresses,
    loading: addressesLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
  } = useAddress();
  const { createDeleteRequest } = useDeleteRequests({ autoFetch: false });
  const { data: materialTypes, refetch: refetchMaterialTypes } = useMasterData('material-type');
  const { data: truckTypes, refetch: refetchTruckTypes } = useMasterData('truck-type');
  const { data: chargeTypes, refetch: refetchChargeTypes } = useMasterData('charge-type');
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

  const handleDeleteRequest = (type: string, id: string, model: string, name: string) => {
    setDeleteTarget({ type, id, model, name });
  };

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
          onAssign={setBranchManager}
          onEdit={setEditingBranch}
          onDelete={(id) => {
            const branch = branches.find((b) => b._id === id);
            handleDeleteRequest('branch', id, 'Branch', branch?.branchName || id);
          }}
          onSetTraffic={setTrafficBranch}
        />
      )}
      {activeTab === 'employees' && (
        <EmployeesTab
          employees={employees}
          loading={employeesLoading}
          pagination={pagination}
          onRefresh={refetchEmployees}
          onDeactivate={async (id) => {
            const emp = employees.find((e) => e._id === id);
            const nextStatus = emp?.status === 'inactive' ? 'active' : 'inactive';
            await updateEmployee(id, { status: nextStatus });
          }}
        />
      )}
      {activeTab === 'accounts' && (
        <AccountsTab
          accounts={accounts}
          loading={accountsLoading}
          onEdit={setEditingAccount}
          onSetPrimary={setPrimaryAccount}
          onDelete={(id) => {
            const account = accounts.find((a) => a._id === id);
            handleDeleteRequest(
              'account',
              id,
              'Account',
              account?.accountHolderName || account?.bankName || id
            );
          }}
        />
      )}
      {activeTab === 'address' && (
        <>
          <AddressTab
            addresses={addresses}
            loading={addressesLoading}
            onEdit={setEditingAddress}
            onDelete={(id) => {
              const addr = addresses.find((a) => a._id === id);
              handleDeleteRequest('address', id, 'OrganizationSettings', addr?.name || id);
            }}
            onSetPrimary={setPrimaryAddress}
          />
          {showAddAddress && (
            <AddAddressModal onClose={() => setShowAddAddress(false)} onSubmit={createAddress} />
          )}
        </>
      )}
      {activeTab === 'lane' && (
        <>
          <LaneTab
            lanes={lanes}
            loading={lanesLoading}
            locations={locations.filter((item) => item.isActive !== false)}
            truckTypes={truckTypes.filter((item) => item.isActive !== false)}
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
          onRefreshMaster={() => {
            refetchMaterialTypes();
            refetchTruckTypes();
            refetchChargeTypes();
          }}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          open={!!editingBranch}
          onClose={() => setEditingBranch(null)}
          onSave={async (id, data) => !!(await updateBranch(id, data))}
        />
      )}

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          open={!!editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}

      {editingAddress && (
        <EditAddressModal
          address={editingAddress}
          open={!!editingAddress}
          onClose={() => setEditingAddress(null)}
          onSave={updateAddress}
        />
      )}

      {deleteTarget && (
        <DeleteRequestModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          resourceType={deleteTarget.type}
          resourceId={deleteTarget.id}
          resourceModel={deleteTarget.model}
          resourceName={deleteTarget.name}
          onSubmit={createDeleteRequest}
        />
      )}

      {trafficBranch && (
        <TrafficCoordinatorModal
          branch={trafficBranch}
          employees={employees}
          onClose={() => setTrafficBranch(null)}
          onAssign={setTrafficCoordinator}
          refetch={refetchBranches}
        />
      )}
    </div>
  );
}
