'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2, MapPin, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BranchesPage() {
  const branches = [
    {
      _id: '1',
      branchCode: 'MUM-01',
      branchName: 'Mumbai Central',
      region: 'West',
      assignedCities: ['Mumbai', 'Thane', 'Navi Mumbai'],
      employees: 12,
      vehicles: 25,
      metrics: {
        bookingsCount: 145,
        revenue: 2500000,
        completionRate: 94.5,
      },
      isActive: true,
    },
    {
      _id: '2',
      branchCode: 'DEL-01',
      branchName: 'Delhi NCR',
      region: 'North',
      assignedCities: ['Delhi', 'Gurgaon', 'Noida', 'Ghaziabad'],
      employees: 18,
      vehicles: 35,
      metrics: {
        bookingsCount: 198,
        revenue: 3200000,
        completionRate: 96.2,
      },
      isActive: true,
    },
    {
      _id: '3',
      branchCode: 'BLR-01',
      branchName: 'Bangalore',
      region: 'South',
      assignedCities: ['Bangalore', 'Mysore'],
      employees: 10,
      vehicles: 20,
      metrics: {
        bookingsCount: 112,
        revenue: 1800000,
        completionRate: 92.8,
      },
      isActive: true,
    },
  ];

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage branches and regional operations"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        }
      />

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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Assigned Cities
                </div>
                <div className="flex flex-wrap gap-1">
                  {branch.assignedCities.map((city) => (
                    <Badge key={city} variant="outline" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    Employees
                  </div>
                  <p className="text-lg font-semibold">{branch.employees}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="h-4 w-4" />
                    Vehicles
                  </div>
                  <p className="text-lg font-semibold">{branch.vehicles}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Performance
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Bookings:</span>
                    <span className="ml-2 font-medium">{branch.metrics.bookingsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Revenue:</span>
                    <span className="ml-2 font-medium">
                      ₹{(branch.metrics.revenue / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Completion Rate:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {branch.metrics.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
