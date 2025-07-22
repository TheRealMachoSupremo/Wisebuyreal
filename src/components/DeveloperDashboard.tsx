import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Bug } from 'lucide-react';
import StoreDetailsDialog from './StoreDetailsDialog';
import { DeveloperDashboardTabs } from './DeveloperDashboardTabs';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useDevLogger } from '@/hooks/useDevLogger';

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

const DeveloperDashboard: React.FC = () => {
  const { logout } = useAppContext();
  const log = useDevLogger('DeveloperDashboard');
  const [stores, setStores] = useState<Store[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    log.info('Dashboard initializing');
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      log.info('Fetching stores from database');
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        log.error('Failed to fetch stores', { error: error.message });
        throw error;
      }
      
      log.info('Successfully fetched stores', { count: data?.length || 0 });
      setStores(data || []);
    } catch (error) {
      log.error('Error in fetchStores', { error }, error as Error);
    } finally {
      setLoading(false);
      log.debug('Store loading completed');
    }
  };

  const updateStoreStatus = async (storeId: string, status: string) => {
    try {
      log.info('Updating store status', { storeId, status });
      const { error } = await supabase
        .from('stores')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      if (error) {
        log.error('Failed to update store status', { storeId, status, error: error.message });
        throw error;
      }
      
      log.info('Store status updated successfully', { storeId, status });
      await fetchStores();
    } catch (error) {
      log.error('Error updating store status', { storeId, status }, error as Error);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      log.debug('Store deletion cancelled by user', { storeId });
      return;
    }
    
    try {
      log.warn('Deleting store', { storeId });
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);
      
      if (error) {
        log.error('Failed to delete store', { storeId, error: error.message });
        throw error;
      }
      
      log.info('Store deleted successfully', { storeId });
      await fetchStores();
    } catch (error) {
      log.error('Error deleting store', { storeId }, error as Error);
    }
  };

  const handleLogout = () => {
    log.info('User logging out');
    logout();
  };

  const handleTabChange = (value: string) => {
    log.debug('Tab changed', { from: activeTab, to: value });
    setActiveTab(value);
  };

  const pendingStores = stores.filter(store => store.status === 'pending');
  const activeStores = stores.filter(store => store.status === 'active');
  const rejectedStores = stores.filter(store => store.status === 'rejected');

  const handleViewDetails = (store: Store) => {
    log.debug('Opening store details dialog', { storeId: store.id, storeName: store.store_name });
    setSelectedStore(store);
    setIsDialogOpen(true);
  };

  if (loading) {
    log.debug('Rendering loading state');
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  log.debug('Rendering dashboard', { 
    totalStores: stores.length, 
    activeStores: activeStores.length, 
    pendingStores: pendingStores.length,
    currentTab: activeTab 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Developer Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Manage stores, monitor system health, and configure platform settings</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Store Overview</TabsTrigger>
            <TabsTrigger value="requests">Registration Requests</TabsTrigger>
            <TabsTrigger value="pricing">Metals Pricing</TabsTrigger>
            <TabsTrigger value="diamonds">Diamond Pricing</TabsTrigger>
            <TabsTrigger value="legend">Component Legend</TabsTrigger>
            <TabsTrigger value="auth">3rd Party Auth</TabsTrigger>
            <TabsTrigger value="logs">
              <Bug className="w-4 h-4 mr-1" />
              Dev Logs
            </TabsTrigger>
          </TabsList>

          <DeveloperDashboardTabs
            stores={stores}
            pendingStores={pendingStores}
            activeStores={activeStores}
            rejectedStores={rejectedStores}
            handleViewDetails={handleViewDetails}
            deleteStore={deleteStore}
            updateStoreStatus={updateStoreStatus}
          />
        </Tabs>
      </div>
      
      <StoreDetailsDialog 
        store={selectedStore}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default DeveloperDashboard;