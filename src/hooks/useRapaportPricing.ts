import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface RapaportPriceData {
  storeId: string;
  lastFetch: string | null;
  expiresAt: string | null;
  isValid: boolean;
}

export const useRapaportPricing = () => {
  const { currentUser } = useAppContext();
  const [priceData, setPriceData] = useState<RapaportPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (currentUser?.storeId) {
      checkRapaportData();
    }
  }, [currentUser?.storeId]);

  const checkRapaportData = async () => {
    if (!currentUser?.storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rapaport_auth_tokens')
        .select('expires_at, last_price_fetch')
        .eq('store_id', currentUser.storeId)
        .single();
      
      if (error || !data) {
        setPriceData({
          storeId: currentUser.storeId,
          lastFetch: null,
          expiresAt: null,
          isValid: false
        });
        return;
      }
      
      const isValid = new Date(data.expires_at) > new Date();
      setPriceData({
        storeId: currentUser.storeId,
        lastFetch: data.last_price_fetch,
        expiresAt: data.expires_at,
        isValid
      });
    } catch (error) {
      console.error('Error checking Rapaport data:', error);
      setPriceData({
        storeId: currentUser.storeId,
        lastFetch: null,
        expiresAt: null,
        isValid: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser?.storeId) {
      return { success: false, error: 'No store selected' };
    }

    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-rapaport-prices', {
        body: { storeId: currentUser.storeId }
      });

      if (error) {
        console.error('Supabase function error:', error);
        return { success: false, error: error.message || 'Failed to fetch prices' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Unknown error occurred' };
      }

      // Refresh local data after successful fetch
      await checkRapaportData();
      
      return { success: true };
    } catch (error) {
      console.error('Error fetching Rapaport prices:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setFetching(false);
    }
  };

  const isPriceDataFresh = (maxAgeInDays: number = 7): boolean => {
    if (!priceData?.lastFetch || !priceData.isValid) return false;
    
    const lastFetchDate = new Date(priceData.lastFetch);
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const now = new Date();
    
    return (now.getTime() - lastFetchDate.getTime()) < maxAge;
  };

  const getRapaportPrice = async (shape: string, color: string, clarity: string, carat: number): Promise<number | null> => {
    // Check if we have fresh Rapaport data
    if (!isPriceDataFresh()) {
      return null;
    }

    // TODO: Implement actual price lookup from cached Rapaport data
    // This would involve parsing the stored CSV files and finding matching entries
    console.log('Looking up Rapaport price for:', { shape, color, clarity, carat });
    
    return null; // Placeholder - implement actual lookup logic
  };

  return {
    priceData,
    loading,
    fetching,
    fetchPrices,
    isPriceDataFresh,
    getRapaportPrice,
    refreshData: checkRapaportData
  };
};

export default useRapaportPricing;