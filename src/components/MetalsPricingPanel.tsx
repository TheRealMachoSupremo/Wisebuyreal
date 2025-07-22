import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Settings, Activity, Clock, Database, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import MetalsHistoryViewer from './MetalsHistoryViewer';
import MetalsPricingPanelContent from './MetalsPricingPanelContent';
import BackfillStatus from './BackfillStatus';
import MarketOverview from './MarketOverview';

interface ApiSettings {
  metals_api_key: string;
  sync_frequency_minutes: string;
  last_sync_timestamp: string;
  sync_status: string;
}

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  last_updated: string;
}

interface SyncLog {
  sync_type: string;
  synced_at: string;
  status: string;
}

const MetalsPricingPanel: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ApiSettings>({
    metals_api_key: '',
    sync_frequency_minutes: '1440',
    last_sync_timestamp: '',
    sync_status: 'inactive'
  });
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<SyncLog | null>(null);
  const [nextSyncDue, setNextSyncDue] = useState<string>('');

  useEffect(() => {
    loadSettings();
    loadPrices();
    loadSyncInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('api_settings').select('setting_key, setting_value');
      if (error) throw error;
      const settingsObj = data.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as any);
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadPrices = async () => {
    try {
      const { data, error } = await supabase.from('live_market_prices').select('*').order('last_updated', { ascending: false });
      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const loadSyncInfo = async () => {
    try {
      const { data, error } = await supabase.from('sync_log').select('*').eq('sync_type', 'live_prices').order('synced_at', { ascending: false }).limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setLastSyncInfo(data[0]);
        const lastSync = new Date(data[0].synced_at);
        const nextSync = new Date(lastSync.getTime() + 24 * 60 * 60 * 1000);
        setNextSyncDue(nextSync.toISOString());
      }
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase.from('api_settings').upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });
      if (error) throw error;
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({ title: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({ title: 'Error updating settings', variant: 'destructive' });
    }
  };

  const testConnection = async () => {
    if (!settings.metals_api_key) {
      toast({ title: 'Please enter API key first', variant: 'destructive' });
      return;
    }
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-metal-prices', {
        body: { test_mode: true }
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Connection test successful!' });
        await loadSettings();
        await loadPrices();
      } else {
        throw new Error(data?.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({ title: 'Connection test failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setTestingConnection(false);
    }
  };

  const manualSync = async () => {
    if (!settings.metals_api_key) {
      toast({ title: 'Please enter API key first', variant: 'destructive' });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-metal-prices', {
        body: { force_sync: true }
      });
      if (error) throw error;
      if (data?.success) {
        setSyncResult(data);
        toast({ title: 'Manual sync completed successfully', description: data.message || 'YEOB prices updated' });
        await loadSettings();
        await loadPrices();
        await loadSyncInfo();
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing prices:', error);
      toast({ title: 'Error syncing prices', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status?.startsWith('error:')) return <Badge variant="destructive">Error</Badge>;
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      default: return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const getTimeUntilNextSync = () => {
    if (!nextSyncDue) return null;
    const now = new Date();
    const nextSync = new Date(nextSyncDue);
    const diff = nextSync.getTime() - now.getTime();
    if (diff <= 0) return 'Sync due now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m until next sync`;
    else return `${minutes}m until next sync`;
  };

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="settings">API Settings</TabsTrigger>
        <TabsTrigger value="snapshot">YEOB Market</TabsTrigger>
        <TabsTrigger value="backfill">Price History Backfill</TabsTrigger>
        <TabsTrigger value="overview">Market Overview</TabsTrigger>
        <TabsTrigger value="history">Price History</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="w-5 h-5 mr-2" />Metals-API Configuration</CardTitle>
            <CardDescription>Configure and manage the Metals-API integration with caching strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api-key">Metals-API Key</Label>
                <Input id="api-key" type="password" value={settings.metals_api_key} onChange={(e) => setSettings(prev => ({ ...prev, metals_api_key: e.target.value }))} placeholder="Enter your Metals-API key" />
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" onClick={() => updateSetting('metals_api_key', settings.metals_api_key)}>Save API Key</Button>
                  <Button size="sm" variant="outline" onClick={testConnection} disabled={testingConnection || !settings.metals_api_key}>{testingConnection ? 'Testing...' : 'Test Connection'}</Button>
                </div>
              </div>
              <div>
                <Label>Caching Strategy</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Smart Caching Enabled</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">YEOB prices cached for 15-60 minutes, historical data cached permanently</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(settings.sync_status)}
                  </div>
                </div>
                <Button onClick={manualSync} disabled={syncing || !settings.metals_api_key} className="flex items-center space-x-2">
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Manual Sync'}</span>
                </Button>
              </div>
              {lastSyncInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-600">Last sync:</span><div className="font-medium">{new Date(lastSyncInfo.synced_at).toLocaleString()}</div></div>
                  <div><span className="text-gray-600">Next sync:</span><div className="font-medium text-blue-600">{getTimeUntilNextSync()}</div></div>
                </div>
              )}
            </div>
            {syncResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800"><strong>Manual Sync Complete:</strong> {syncResult.message}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="snapshot">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="w-5 h-5 mr-2" />YEOB Market Snapshot</CardTitle>
            <CardDescription>Yesterday's end of business precious metal prices with smart caching</CardDescription>
          </CardHeader>
          <CardContent><MetalsPricingPanelContent prices={prices} /></CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backfill"><BackfillStatus onBackfillComplete={loadPrices} /></TabsContent>
      <TabsContent value="overview"><MarketOverview /></TabsContent>
      <TabsContent value="history"><MetalsHistoryViewer /></TabsContent>
    </Tabs>
  );
};

export default MetalsPricingPanel;