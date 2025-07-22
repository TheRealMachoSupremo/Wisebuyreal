import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Database, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CacheStatus {
  live_prices_count: number;
  historical_count: number;
  last_live_update: string | null;
  history_synced: boolean;
}

const CacheStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<CacheStatus>({
    live_prices_count: 0,
    historical_count: 0,
    last_live_update: null,
    history_synced: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCacheStatus();
    const interval = setInterval(fetchCacheStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCacheStatus = async () => {
    try {
      // Get live prices count and last update
      const { data: liveData, error: liveError } = await supabase
        .from('live_market_prices')
        .select('last_updated')
        .order('last_updated', { ascending: false });
      
      if (liveError) throw liveError;

      // Get historical data count
      const { count: historicalCount, error: histError } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true });
      
      if (histError) throw histError;

      // Check if history is synced
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('history_synced')
        .limit(1);
      
      if (storeError) throw storeError;

      setStatus({
        live_prices_count: liveData?.length || 0,
        historical_count: historicalCount || 0,
        last_live_update: liveData?.[0]?.last_updated || null,
        history_synced: storeData?.[0]?.history_synced || false
      });
    } catch (error) {
      console.error('Error fetching cache status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSinceUpdate = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading cache status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Live Cache:</span>
              <Badge variant="outline" className="text-xs">
                {status.live_prices_count} metals
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Historical:</span>
              <Badge variant="outline" className="text-xs">
                {status.historical_count.toLocaleString()} records
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Last Update:</span>
              <Badge variant="secondary" className="text-xs">
                {status.last_live_update ? getTimeSinceUpdate(status.last_live_update) : 'Never'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={status.history_synced ? "default" : "destructive"}
              className="text-xs"
            >
              {status.history_synced ? '180-Day Sync Complete' : 'History Sync Pending'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheStatusIndicator;