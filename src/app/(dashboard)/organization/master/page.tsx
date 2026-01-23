'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MasterDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Manage system-wide master data categories"
      />

      <Tabs defaultValue="truck-type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="truck-type">Truck Types</TabsTrigger>
          <TabsTrigger value="material-type">Material Types</TabsTrigger>
          <TabsTrigger value="charge-type">Charge Types</TabsTrigger>
          <TabsTrigger value="body-type">Body Types</TabsTrigger>
          <TabsTrigger value="document-type">Document Types</TabsTrigger>
        </TabsList>

        <TabsContent value="truck-type">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Truck Types</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Truck Type
                </Button>
              </div>
              <div className="space-y-2">
                {['14 ft', '17 ft', '19 ft', '20 ft', '22 ft', '24 ft', '32 ft'].map((type, idx) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <span className="font-medium">{type}</span>
                      <Badge variant="outline" className="text-xs">
                        Used in 25 bookings
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material-type">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Material Types</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material Type
                </Button>
              </div>
              <div className="space-y-2">
                {['FMCG', 'Steel', 'Tiles', 'Furniture', 'Electronics'].map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <span className="font-medium">{type}</span>
                      <Badge variant="outline" className="text-xs">
                        Used in 42 bookings
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add other tabs similarly */}
        <TabsContent value="charge-type">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Charge Types management (to be implemented)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="body-type">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Body Types management (to be implemented)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document-type">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Document Types management (to be implemented)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
