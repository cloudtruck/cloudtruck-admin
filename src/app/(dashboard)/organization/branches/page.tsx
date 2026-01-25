'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranches } from '@/hooks/useBranches';
import { AddBranchModal } from '@/components/organization/AddBranchModal';

export default function BranchesPage() {
  const { branches, loading, refetch } = useBranches();

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      North: 'bg-blue-100 text-blue-800',
      South: 'bg-green-100 text-green-800',
      East: 'bg-yellow-100 text-yellow-800',
      West: 'bg-purple-100 text-purple-800',
      Central: 'bg-orange-100 text-orange-800',
    };
    return colors[region] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Branches"
          description="Manage branches and regional operations"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage branches and regional operations"
        actions={<AddBranchModal onSuccess={refetch} />}
      />

      {branches.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first branch
              </p>
              <AddBranchModal onSuccess={refetch} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {branch.branchName}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{branch.branchCode}</p>
                  </div>
                  <Badge className={getRegionColor(branch.region)}>{branch.region}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assigned Cities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4" />
                    Assigned Cities
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {branch.assignedCities && branch.assignedCities.length > 0 ? (
                      branch.assignedCities.map((city) => (
                        <Badge key={city} variant="outline" className="text-xs">
                          {city}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No cities assigned</p>
                    )}
                  </div>
                </div>

                {/* Resources */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      Employees
                    </div>
                    <p className="text-2xl font-bold">
                      {branch.employees?.length || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      Vehicles
                    </div>
                    <p className="text-2xl font-bold">
                      {branch.vehicles?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                {branch.metrics && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <TrendingUp className="h-4 w-4" />
                      Performance
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Bookings</p>
                        <p className="font-semibold">{branch.metrics.bookingsCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-semibold">
                          {formatCurrency(branch.metrics.revenue || 0)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Completion Rate</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${branch.metrics.completionRate || 0}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-xs">
                            {branch.metrics.completionRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Empty State for Phase 2 notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Branch management is prepared for future expansion. Branch
            assignment is currently optional and will be enabled when your team scales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
