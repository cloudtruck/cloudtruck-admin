'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VehicleTable } from '@/components/vehicles/VehicleTable';
import { MarketTable } from '@/components/vehicles/MarketTable';
import { VehicleMapView } from '@/components/vehicles/VehicleMapView';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle, Pagination, VehicleFilters } from '@/types';
import { useMasterData } from '@/hooks/useMasterData';
import { Search, X, Map, Table2, FileSpreadsheet, ChevronDown, Upload } from 'lucide-react';

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = 'all' | 'market' | 'owned';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Trucks' },
  { key: 'market', label: 'Market' },
  { key: 'owned', label: 'Owned' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TruckReportButton({ onClick }: { onClick: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onClick={onClick}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="flex items-center justify-center h-8 w-8 border rounded bg-white hover:bg-gray-50 text-green-600"
      >
        <FileSpreadsheet className="h-4 w-4" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none">
          Truck Report
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </div>
  );
}

// ─── Empty pagination helper ──────────────────────────────────────────────────

const emptyPagination = (): Pagination => ({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [fastagOpen, setFastagOpen] = useState(false);

  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');

  // ── All Trucks tab state ───────────────────────────────────────────────────
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allFilters, setAllFilters] = useState<VehicleFilters>({});
  const [allSearchInput, setAllSearchInput] = useState('');
  const [allPagination, setAllPagination] = useState<Pagination>(emptyPagination());

  // ── Market tab state (ownershipType=attached) ──────────────────────────────
  const [marketVehicles, setMarketVehicles] = useState<Vehicle[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketPagination, setMarketPagination] = useState<Pagination>(emptyPagination());

  // ── Owned tab state (ownershipType=own|leased) ─────────────────────────────
  const [ownedVehicles, setOwnedVehicles] = useState<Vehicle[]>([]);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedPagination, setOwnedPagination] = useState<Pagination>(emptyPagination());

  // ── Fetch functions ────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setAllLoading(true);
    try {
      const res = await vehicleApi.getAll({
        ...allFilters,
        page: allPagination.currentPage,
        limit: 20,
      });
      setAllVehicles(res.data.data.vehicles);
      setAllPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to fetch vehicles');
    } finally {
      setAllLoading(false);
    }
  };

  const fetchMarket = async () => {
    setMarketLoading(true);
    try {
      const res = await vehicleApi.getAll({
        ownershipType: 'attached',
        page: marketPagination.currentPage,
        limit: 20,
      });
      setMarketVehicles(res.data.data.vehicles);
      setMarketPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to fetch market vehicles');
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchOwned = async () => {
    setOwnedLoading(true);
    try {
      const res = await vehicleApi.getAll({
        ownershipType: ['own', 'leased'],
        page: ownedPagination.currentPage,
        limit: 20,
      });
      setOwnedVehicles(res.data.data.vehicles);
      setOwnedPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to fetch owned vehicles');
    } finally {
      setOwnedLoading(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Fetch counts for non-active tabs on mount so badges show immediately
  useEffect(() => {
    fetchMarket();
    fetchOwned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'all') fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allFilters, allPagination.currentPage]);

  useEffect(() => {
    if (activeTab === 'market') fetchMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, marketPagination.currentPage]);

  useEffect(() => {
    if (activeTab === 'owned') fetchOwned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ownedPagination.currentPage]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAllSearch = () => {
    setAllFilters((f) => ({ ...f, search: allSearchInput }));
    setAllPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handleAllClearFilters = () => {
    setAllFilters({});
    setAllSearchInput('');
    setAllPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await vehicleApi.delete(id);
      toast.success('Vehicle deleted');
      if (activeTab === 'all') fetchAll();
      else if (activeTab === 'market') fetchMarket();
      else fetchOwned();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleRejectVehicleKyc = async (id: string, reason: string) => {
    try {
      await vehicleApi.reject(id, { reason });
      toast.success('KYC rejected');
      if (activeTab === 'all') fetchAll();
      else if (activeTab === 'market') fetchMarket();
      else fetchOwned();
    } catch {
      toast.error('Failed to reject KYC');
    }
  };

  const hasActiveFilters =
    allFilters.search || allFilters.status || allFilters.truckType || allFilters.verificationStatus;

  const downloadTruckReport = async () => {
    try {
      toast.info('Preparing report…');
      const response = await vehicleApi.getAll({ limit: 10000 });
      const rows = response.data.data.vehicles;
      const headers = [
        'Vehicle No',
        'Truck Type',
        'Body Type',
        'Capacity',
        'Ownership',
        'Owner',
        'KYC Status',
        'Availability',
        'City',
        'Insurance Expiry',
        'Trips',
      ];
      const lines = [
        headers.join(','),
        ...rows.map((v) => {
          const ownerRef =
            v.ownerRef?.item && typeof v.ownerRef.item === 'object' ? v.ownerRef.item : null;
          const legacyOwner = typeof v.owner === 'object' ? v.owner : null;
          const owner = ownerRef ?? legacyOwner;
          return [
            v.vehicleNumber,
            v.truckType,
            v.bodyType,
            `${v.capacity.value} ${v.capacity.unit}`,
            v.ownershipType || '',
            (owner as { name?: string; displayName?: string } | null)?.name ??
              (owner as { displayName?: string } | null)?.displayName ??
              '',
            v.verificationStatus,
            v.availability,
            v.registrationCity || '',
            v.expiryDates?.insurance || '',
            v.stats?.completedTrips ?? 0,
          ]
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(',');
        }),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `truck-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Truck report downloaded');
    } catch {
      toast.error('Failed to download report');
    }
  };

  const refreshCurrent = () => {
    if (activeTab === 'all') fetchAll();
    else if (activeTab === 'market') fetchMarket();
    else fetchOwned();
  };

  // ── Current tab vehicles/pagination for shared props ───────────────────────

  const currentVehicles =
    activeTab === 'all' ? allVehicles : activeTab === 'market' ? marketVehicles : ownedVehicles;
  const currentLoading =
    activeTab === 'all' ? allLoading : activeTab === 'market' ? marketLoading : ownedLoading;
  const currentPagination =
    activeTab === 'all'
      ? allPagination
      : activeTab === 'market'
        ? marketPagination
        : ownedPagination;
  const currentPageChange = (page: number) => {
    if (activeTab === 'all') setAllPagination((p) => ({ ...p, currentPage: page }));
    else if (activeTab === 'market') setMarketPagination((p) => ({ ...p, currentPage: page }));
    else setOwnedPagination((p) => ({ ...p, currentPage: page }));
  };

  const sharedTableProps = {
    vehicles: currentVehicles,
    loading: currentLoading,
    pagination: currentPagination,
    onPageChange: currentPageChange,
    onDelete: handleDeleteVehicle,
    onRejectKyc: handleRejectVehicleKyc,
    onRefresh: refreshCurrent,
  };

  return (
    <div className="space-y-0">
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        {/* Tabs */}
        <div className="flex items-end gap-0">
          {TABS.map((tab) => {
            const badge =
              tab.key === 'all'
                ? allPagination.totalItems
                : tab.key === 'market'
                  ? marketPagination.totalItems
                  : ownedPagination.totalItems;
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Map toggle — All Trucks only */}
          {activeTab === 'all' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm gap-1.5"
                onClick={() => setViewMode((v) => (v === 'table' ? 'map' : 'table'))}
              >
                {viewMode === 'table' ? (
                  <>
                    <Map className="h-3.5 w-3.5" /> Map
                  </>
                ) : (
                  <>
                    <Table2 className="h-3.5 w-3.5" /> Table
                  </>
                )}
              </Button>
              {/* Fastag split button */}
              <div className="relative flex">
                <input
                  id="fastag-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) toast.success(`Uploading ${file.name}…`);
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="fastag-upload"
                  className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium border border-r-0 rounded-l cursor-pointer bg-white hover:bg-gray-50 text-gray-700"
                >
                  <Upload className="h-3.5 w-3.5" /> Fastag
                </label>
                <button
                  onClick={() => setFastagOpen((o) => !o)}
                  className="flex items-center px-2 h-8 border rounded-r bg-white hover:bg-gray-50 text-gray-500"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {fastagOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFastagOpen(false)} />
                    <div className="absolute top-9 right-0 z-20 bg-white border rounded shadow-md min-w-[180px] py-1">
                      <a
                        href="#"
                        download="fastag-data-format.xlsx"
                        onClick={() => setFastagOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Fastag Data Format
                        <FileSpreadsheet className="h-4 w-4 text-green-600 flex-shrink-0" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <TruckReportButton onClick={downloadTruckReport} />
          <AddVehicleModal onSuccess={refreshCurrent} />

          {activeTab === 'all' && (
            <Button variant="outline" size="sm" className="h-8 text-sm text-gray-400" disabled>
              Update Tracking
            </Button>
          )}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="border-b mb-4" />

      {/* ── All Trucks tab ──────────────────────────────────────────────── */}
      {activeTab === 'all' && viewMode === 'map' && <VehicleMapView vehicles={allVehicles} />}

      {activeTab === 'all' && viewMode === 'table' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search vehicle number..."
                value={allSearchInput}
                onChange={(e) => setAllSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAllSearch()}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select
              value={allFilters.truckType || 'all'}
              onValueChange={(v) => {
                setAllFilters((f) => ({ ...f, truckType: v === 'all' ? undefined : v }));
                setAllPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              disabled={truckTypesLoading}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {truckTypes
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <SelectItem key={t._id} value={t.key}>
                      {t.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={allFilters.status || 'all'}
              onValueChange={(v) => {
                setAllFilters((f) => ({ ...f, status: v === 'all' ? undefined : v }));
                setAllPagination((p) => ({ ...p, currentPage: 1 }));
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on-trip">On Trip</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={allFilters.verificationStatus || 'all'}
              onValueChange={(v) => {
                setAllFilters((f) => ({
                  ...f,
                  verificationStatus: v === 'all' ? undefined : v,
                }));
                setAllPagination((p) => ({ ...p, currentPage: 1 }));
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button onClick={handleAllClearFilters} variant="ghost" size="sm" className="h-8">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
          <VehicleTable {...sharedTableProps} />
        </div>
      )}

      {/* ── Market tab (attached trucks) ─────────────────────────────────── */}
      {activeTab === 'market' && <MarketTable {...sharedTableProps} />}

      {/* ── Owned tab (own + leased trucks) ─────────────────────────────── */}
      {activeTab === 'owned' && <VehicleTable {...sharedTableProps} />}
    </div>
  );
}
