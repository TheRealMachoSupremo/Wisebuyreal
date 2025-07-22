import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Database, Settings, Eye, RefreshCw, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { useRapaportPricing } from '@/hooks/useRapaportPricing';
import CSVUploader from './CSVUploader';
import PricingDataViewer from './PricingDataViewer';
import RapaportAuthButton from './RapaportAuthButton';
import StoreDiamondPricingPanel from './StoreDiamondPricingPanel';

interface PricingStats {
  roundCount: number;
  fancyCount: number;
  lastUpdated: string;
}

export default function DiamondPricingTab() {
  const { currentUser } = useAppContext();
  const { priceData, fetching, fetchPrices, isPriceDataFresh } = useRapaportPricing();
  const [useDevPricing, setUseDevPricing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PricingStats>({ roundCount: 0, fancyCount: 0, lastUpdated: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, [currentUser?.storeId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'use_dev_diamond_pricing')
        .single();
      
      if (error) throw error;
      setUseDevPricing(data.setting_value);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: roundData } = await supabase
        .from('diamond_pricing_lists')
        .select('count')
        .eq('shape_type', 'round');
      
      const { data: fancyData } = await supabase
        .from('diamond_pricing_lists')
        .select('count')
        .eq('shape_type', 'fancy');
      
      const { data: lastUpdate } = await supabase
        .from('diamond_pricing_lists')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      setStats({
        roundCount: roundData?.length || 0,
        fancyCount: fancyData?.length || 0,
        lastUpdated: lastUpdate?.[0]?.updated_at || 'Never'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleDevPricing = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: enabled, updated_at: new Date().toISOString() })
        .eq('setting_key', 'use_dev_diamond_pricing');
      
      if (error) throw error;
      
      setUseDevPricing(enabled);
      toast({
        title: 'Settings Updated',
        description: `Development diamond pricing ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  const handleFetchPrices = async () => {
    const result = await fetchPrices();
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Rapaport prices fetched and cached successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to fetch Rapaport prices',
        variant: 'destructive'
      });
    }
  };

  const handleUploadComplete = () => {
    loadStats();
    toast({
      title: 'Upload Complete',
      description: 'Pricing data has been updated successfully',
    });
  };

  const handleAuthSuccess = () => {
    toast({
      title: 'Authentication Successful',
      description: 'Connected to Rapaport successfully',
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Diamond Pricing Settings</span>
          </CardTitle>
          <CardDescription>
            Configure how diamond pricing is determined for quotes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Dev CSV Mode</h3>
              <p className="text-sm text-gray-600">
                When enabled, always use local CSV files instead of Rapaport
              </p>
            </div>
            <Switch
              checked={useDevPricing}
              onCheckedChange={toggleDevPricing}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={useDevPricing ? 'default' : 'secondary'}>
              {useDevPricing ? 'CSV Mode: ON' : 'CSV Mode: OFF'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <StoreDiamondPricingPanel />

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Local CSV</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>View Data</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CSVUploader shapeType="round" onUploadComplete={handleUploadComplete} />
            <CSVUploader shapeType="fancy" onUploadComplete={handleUploadComplete} />
          </div>
        </TabsContent>
        
        <TabsContent value="view" className="space-y-6">
          <Tabs defaultValue="round" className="w-full">
            <TabsList>
              <TabsTrigger value="round">Round Diamonds</TabsTrigger>
              <TabsTrigger value="fancy">Fancy Diamonds</TabsTrigger>
            </TabsList>
            
            <TabsContent value="round">
              <PricingDataViewer shapeType="round" />
            </TabsContent>
            
            <TabsContent value="fancy">
              <PricingDataViewer shapeType="fancy" />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}