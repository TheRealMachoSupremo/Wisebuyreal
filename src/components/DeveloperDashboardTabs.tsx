import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import MetalsPricingPanel from './MetalsPricingPanel';
import ComponentLegend from './ComponentLegend';
import ThirdPartyAuthTab from './ThirdPartyAuthTab';
import DiamondPricingTab from './DiamondPricingTab';
import { DevLoggerPanel } from './DevLogger';

interface Store {
  id: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_website?: string;
  admin_name: string;
  admin_email: string;
  admin_password?: string;
  gold_markup: number;
  silver_markup: number;
  platinum_markup: number;
  status: string;
  created_at: string;
}

interface Props {
  stores: Store[];
  pendingStores: Store[];
  activeStores: Store[];
  rejectedStores: Store[];
  handleViewDetails: (store: Store) => void;
  deleteStore: (storeId: string) => void;
  updateStoreStatus: (storeId: string, status: string) => void;
}

export const DeveloperDashboardTabs: React.FC<Props> = ({
  stores,
  pendingStores,
  activeStores,
  rejectedStores,
  handleViewDetails,
  deleteStore,
  updateStoreStatus
}) => {
  return (
    <>
      <TabsContent value="logs" className="space-y-6">
        <DevLoggerPanel />
      </TabsContent>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Stores</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{activeStores.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Pending Approval</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{pendingStores.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Rejected Stores</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{rejectedStores.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Stores</CardTitle>
            <CardDescription>Complete overview of all registered stores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{store.store_name}</h3>
                    <p className="text-sm text-gray-600">{store.admin_email}</p>
                    <p className="text-sm text-gray-500">{store.store_address}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={store.status === 'active' ? 'default' : store.status === 'pending' ? 'secondary' : 'destructive'}>
                      {store.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(store)}>
                      View Details
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteStore(store.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="requests" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Registration Requests</CardTitle>
            <CardDescription>Review and approve new store applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingStores.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending registration requests</p>
              ) : (
                pendingStores.map((store) => (
                  <div key={store.id} className="p-4 border rounded-lg bg-yellow-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{store.store_name}</h3>
                        <p className="text-gray-600">{store.store_address}</p>
                        <p className="text-gray-600">{store.store_phone}</p>
                        {store.store_website && <p className="text-gray-600">{store.store_website}</p>}
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <div className="mb-4">
                      <p><strong>Admin:</strong> {store.admin_name} ({store.admin_email})</p>
                      <p><strong>Metal Markup:</strong> Gold: {store.gold_markup}%, Silver: {store.silver_markup}%, Platinum: {store.platinum_markup}%</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => updateStoreStatus(store.id, 'active')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Store
                      </Button>
                      <Button 
                        onClick={() => updateStoreStatus(store.id, 'rejected')}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Store
                      </Button>
                      <Button 
                        onClick={() => handleViewDetails(store)}
                        variant="outline"
                      >
                        View Details
                      </Button>
                      <Button 
                        onClick={() => deleteStore(store.id)}
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-6">
        <MetalsPricingPanel />
      </TabsContent>

      <TabsContent value="diamonds" className="space-y-6">
        <DiamondPricingTab />
      </TabsContent>

      <TabsContent value="legend" className="space-y-6">
        <ComponentLegend />
      </TabsContent>

      <TabsContent value="auth" className="space-y-6">
        <ThirdPartyAuthTab />
      </TabsContent>
    </>
  );
};