import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { usePricingCache } from '@/hooks/usePricingCache';
import { Settings, Users, DollarSign, Key, ArrowLeft, Plus, Edit, Trash2, Clock } from 'lucide-react';
import StorePricingSettings from './StorePricingSettings';
import RapaportAuthButton from './RapaportAuthButton';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { currentUser, stores } = useAppContext();
  const { cachedPricing } = usePricingCache(currentUser?.storeId);
  const [activeTab, setActiveTab] = useState('settings');
  const [apiCredentials, setApiCredentials] = useState({
    rapnetUsername: '',
    rapnetPassword: ''
  });
  const [users] = useState([
    { id: '1', name: 'John Smith', email: 'john@store.com', role: 'store_user', status: 'active' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@store.com', role: 'store_user', status: 'active' }
  ]);

  const currentStore = stores.find(store => store.id === currentUser?.storeId);

  const handleApiCredentialChange = (field: string, value: string) => {
    setApiCredentials(prev => ({ ...prev, [field]: value }));
  };

  const getPricingBasisLabel = (basis: string) => {
    switch (basis) {
      case 'YEOB': return 'YEOB (Yesterday End of Business)';
      case '90_days': return '90-Day Average';
      case '180_days': return '180-Day Average';
      default: return 'YEOB (Yesterday End of Business)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-600">Manage store settings and users</p>
            </div>
            {cachedPricing && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Cached Pricing Active
                </Badge>
                <div className="text-sm text-gray-600">
                  {cachedPricing.discount}% discount • {getPricingBasisLabel(cachedPricing.pricing_basis)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Store Settings</TabsTrigger>
            <TabsTrigger value="pricing" className="relative">
              Metal Pricing
              {cachedPricing && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Store Information
                </CardTitle>
                <CardDescription>Update your store's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" value={currentStore?.name || ''} />
                  </div>
                  <div>
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input id="storePhone" value={currentStore?.phone || ''} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input id="storeAddress" value={currentStore?.address || ''} />
                </div>
                <div>
                  <Label htmlFor="storeWebsite">Store Website</Label>
                  <Input id="storeWebsite" value={currentStore?.website || ''} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Rapaport Integration
                </CardTitle>
                <CardDescription>Connect your store to Rapaport for diamond pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RapaportAuthButton />
                <div className="text-sm text-gray-600">
                  <p>Connect to Rapaport to access real-time diamond pricing and inventory data.</p>
                  <p className="mt-2">Required scopes: manageListings, priceListWeekly, instantInventory, offline_access</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            {cachedPricing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Clock className="w-5 h-5 mr-2" />
                    Cached Pricing Configuration Active
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Your store is currently using cached pricing settings. Market prices shown below reflect your cached configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Pricing Basis:</span>
                      <div className="text-blue-800">{getPricingBasisLabel(cachedPricing.pricing_basis)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Store Discount:</span>
                      <div className="text-blue-800">{cachedPricing.discount}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <div className="text-blue-800">{new Date(cachedPricing.last_updated).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <StorePricingSettings />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </CardTitle>
                <CardDescription>Manage store users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <Badge variant="secondary" className="mt-1">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;