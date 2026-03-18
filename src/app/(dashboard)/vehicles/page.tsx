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
import { DriverTabTable } from '@/components/vehicles/DriverTabTable';
import { FuelTabTable } from '@/components/vehicles/FuelTabTable';
import { MaintenanceTabTable } from '@/components/vehicles/MaintenanceTabTable';
import { VehicleMapView } from '@/components/vehicles/VehicleMapView';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { vehicleApi, driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle, Pagination, VehicleFilters, Driver } from '@/types';
import { useMasterData } from '@/hooks/useMasterData';
import { Search, X, Map, Table2, FileSpreadsheet, UserPlus, Fuel, Plus, Calendar, ChevronDown, Upload } from 'lucide-react';

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = 'trucks' | 'market' | 'driver' | 'fuel' | 'maintenance';

const TABS: { key: Tab; label: string }[] = [
  { key: 'trucks',      label: 'Trucks' },
  { key: 'market',      label: 'Market' },
  { key: 'driver',      label: 'Driver' },
  { key: 'fuel',        label: 'Fuel' },
  { key: 'maintenance', label: 'Maintenance' },
];

// ─── Placeholder for unimplemented tabs ──────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="bg-white rounded border p-16 flex flex-col items-center gap-3 text-gray-400">
      <FileSpreadsheet className="h-10 w-10 opacity-20" />
      <p className="text-sm">{label} — coming soon</p>
    </div>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trucks');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [fastagOpen, setFastagOpen] = useState(false);

  // ── Vehicles state (Trucks + Market tabs) ─────────────────────────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // ── Maintenance date range ────────────────────────────────────────────────
  const [maintStartDate, setMaintStartDate] = useState('');
  const [maintEndDate, setMaintEndDate] = useState('');

  // ── Drivers state (Driver tab) ────────────────────────────────────────────
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverPagination, setDriverPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  useEffect(() => {
    if (activeTab === 'trucks' || activeTab === 'market') fetchVehicles();
    if (activeTab === 'driver') fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage, driverPagination.currentPage, activeTab]);

  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const response = await vehicleApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: 20,
      });
      setVehicles(response.data.data.vehicles);
      setPagination(response.data.data.pagination);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const response = await driverApi.getAll({
        page: driverPagination.currentPage,
        limit: 20,
      });
      setDrivers(response.data.data.drivers);
      setDriverPagination(response.data.data.pagination);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setDriversLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchInput('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await vehicleApi.delete(id);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleRejectVehicleKyc = async (id: string) => {
    if (!confirm('Reject KYC for this vehicle?')) return;
    try {
      await vehicleApi.reject(id, { reason: 'Rejected by admin' });
      toast.success('KYC rejected');
      fetchVehicles();
    } catch {
      toast.error('Failed to reject KYC');
    }
  };

  const handleRejectDriverKyc = async (id: string) => {
    if (!confirm('Reject KYC for this driver?')) return;
    try {
      await driverApi.reject(id, { reason: 'Rejected by admin' });
      toast.success('Driver KYC rejected');
      fetchDrivers();
    } catch {
      toast.error('Failed to reject driver KYC');
    }
  };

  const hasActiveFilters = filters.search || filters.status || filters.truckType || filters.verificationStatus;

  const downloadTruckReport = async () => {
    try {
      toast.info('Preparing report…');
      const response = await vehicleApi.getAll({ limit: 10000 });
      const rows = response.data.data.vehicles;
      const headers = ['Vehicle No', 'Truck Type', 'Body Type', 'Capacity', 'Ownership', 'Driver', 'KYC Status', 'Availability', 'City', 'Insurance Expiry', 'Trips'];
      const lines = [
        headers.join(','),
        ...rows.map((v) => {
          const owner = typeof v.owner === 'object' ? v.owner : null;
          const driver = typeof v.driver === 'object' ? v.driver : null;
          return [
            v.vehicleNumber,
            v.truckType,
            v.bodyType,
            `${v.capacity.value} ${v.capacity.unit}`,
            v.ownershipType || '',
            owner?.name || driver?.name || '',
            v.verificationStatus,
            v.availability,
            v.registrationCity || '',
            v.expiryDates?.insurance || '',
            v.stats?.completedTrips ?? 0,
          ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
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

  const sharedVehicleProps = {
    vehicles,
    loading: vehiclesLoading,
    pagination,
    onPageChange: (page: number) => setPagination((prev) => ({ ...prev, currentPage: page })),
    onDelete: handleDeleteVehicle,
    onRejectKyc: handleRejectVehicleKyc,
  };

  // Badge counts
  const trucksBadge = (activeTab === 'trucks' || activeTab === 'market') ? pagination.totalItems : 0;
  const driversBadge = driverPagination.totalItems;

  return (
    <div className="space-y-0">
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        {/* Tabs */}
        <div className="flex items-end gap-0">
          {TABS.map((tab) => {
            const badge =
              tab.key === 'trucks' ? pagination.totalItems
              : tab.key === 'market' ? trucksBadge
              : tab.key === 'driver' ? driversBadge
              : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5
                  ${activeTab === tab.key
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
          {/* Date range — only shown on Maintenance tab */}
          {activeTab === 'maintenance' && (
            <div className="flex items-center gap-1 border rounded h-8 px-2 text-sm text-gray-400 bg-white">
              <input
                type="date"
                value={maintStartDate}
                onChange={(e) => setMaintStartDate(e.target.value)}
                className="border-none outline-none text-xs text-gray-500 w-[90px] bg-transparent"
                placeholder="Start date"
              />
              <span className="text-gray-300 mx-1">→</span>
              <input
                type="date"
                value={maintEndDate}
                onChange={(e) => setMaintEndDate(e.target.value)}
                className="border-none outline-none text-xs text-gray-500 w-[90px] bg-transparent"
                placeholder="End date"
              />
              <Calendar className="h-3.5 w-3.5 text-gray-400 ml-1" />
            </div>
          )}

          {/* Trucks tab: single toggle button + Fastag */}
          {activeTab === 'trucks' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm gap-1.5"
                onClick={() => setViewMode((v) => v === 'table' ? 'map' : 'table')}
              >
                {viewMode === 'table'
                  ? <><Map className="h-3.5 w-3.5" /> Map</>
                  : <><Table2 className="h-3.5 w-3.5" /> Table</>
                }
              </Button>
              {/* Fastag split button */}
              <div className="relative flex">
                {/* Hidden file input */}
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
                {/* Upload part */}
                <label
                  htmlFor="fastag-upload"
                  className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium border border-r-0 rounded-l cursor-pointer bg-white hover:bg-gray-50 text-gray-700"
                >
                  <Upload className="h-3.5 w-3.5" /> Fastag
                </label>
                {/* Chevron dropdown part */}
                <button
                  onClick={() => setFastagOpen((o) => !o)}
                  className="flex items-center px-2 h-8 border rounded-r bg-white hover:bg-gray-50 text-gray-500"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {/* Dropdown */}
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
              <TruckReportButton onClick={downloadTruckReport} />
            </>
          )}

          {/* Non-trucks, non-maintenance: Excel only */}
          {activeTab !== 'maintenance' && activeTab !== 'trucks' && (
            <TruckReportButton onClick={downloadTruckReport} />
          )}

          {/* Primary CTA — varies by tab */}
          {activeTab === 'driver' ? (
            <Button size="sm" className="h-8 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-3.5 w-3.5" /> Add Driver
            </Button>
          ) : activeTab === 'fuel' ? (
            <Button size="sm" className="h-8 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <Fuel className="h-3.5 w-3.5" /> Add Fuel Station
            </Button>
          ) : activeTab === 'maintenance' ? (
            <Button size="sm" className="h-8 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          ) : (
            <AddVehicleModal onSuccess={fetchVehicles} />
          )}

          {activeTab === 'trucks' && (
            <Button variant="outline" size="sm" className="h-8 text-sm text-gray-400" disabled>
              Update Tracking
            </Button>
          )}
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="border-b mb-4" />

      {/* ── Trucks tab ──────────────────────────────────────────────────── */}
      {activeTab === 'trucks' && viewMode === 'map' && (
        <VehicleMapView vehicles={vehicles} />
      )}

      {activeTab === 'trucks' && viewMode === 'table' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search vehicle number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select
              value={filters.truckType || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, truckType: v === 'all' ? undefined : v });
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              disabled={truckTypesLoading}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Truck Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {truckTypes.filter((t) => t.isActive).map((t) => (
                  <SelectItem key={t._id} value={t.key}>{t.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, status: v === 'all' ? undefined : v });
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on-trip">On Trip</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.verificationStatus || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, verificationStatus: v === 'all' ? undefined : v });
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="KYC Status" />
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
              <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-8">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <VehicleTable {...sharedVehicleProps} onRefresh={fetchVehicles} />
        </div>
      )}

      {/* ── Market tab ──────────────────────────────────────────────────── */}
      {activeTab === 'market' && (
        <MarketTable {...sharedVehicleProps} />
      )}

      {/* ── Driver tab ──────────────────────────────────────────────────── */}
      {activeTab === 'driver' && (
        <DriverTabTable
          drivers={drivers}
          loading={driversLoading}
          pagination={driverPagination}
          onPageChange={(page) => setDriverPagination((prev) => ({ ...prev, currentPage: page }))}
          onRejectKyc={handleRejectDriverKyc}
        />
      )}

      {/* ── Fuel tab ────────────────────────────────────────────────────── */}
      {activeTab === 'fuel' && <FuelTabTable />}

      {/* ── Maintenance tab ─────────────────────────────────────────────── */}
      {activeTab === 'maintenance' && <MaintenanceTabTable />}
    </div>
  );
}
