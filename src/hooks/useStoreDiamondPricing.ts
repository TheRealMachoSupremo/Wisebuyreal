import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PriceList {
  id: string;
  store_id: string;
  list_type: 'round' | 'fancy';
  fetched_at: string;
  updated_by_user_id: string;
  content: any;
}

interface PriceLists {
  round?: PriceList;
  fancy?: PriceList;
}

export const useStoreDiamondPricing = (storeId: string) => {
  const [priceLists, setPriceLists] = useState<PriceLists>({});
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadPriceLists();
      checkConnection();
    }
  }, [storeId]);

  const loadPriceLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_diamond_pricelists')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;

      const lists: PriceLists = {};
      data?.forEach((list) => {
        lists[list.list_type as 'round' | 'fancy'] = list;
      });
      
      setPriceLists(lists);
    } catch (error) {
      console.error('Error loading price lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('rapaport_auth_tokens')
        .select('expires_at')
        .eq('store_id', storeId)
        .single();

      if (error || !data) {
        setIsConnected(false);
        return;
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      setIsConnected(expiresAt > now);
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    }
  };

  const refreshPriceList = async (listType: 'round' | 'fancy') => {
    try {
      setLoading(true);
      
      // Get current token
      const { data: tokenData, error: tokenError } = await supabase
        .from('rapaport_auth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('store_id', storeId)
        .single();

      if (tokenError || !tokenData) {
        throw new Error('No valid authentication token found');
      }

      // Check if token is expired and refresh if needed
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      
      let accessToken = tokenData.access_token;
      
      if (expiresAt <= now) {
        // Token expired, refresh it
        const { data: refreshData } = await supabase.functions.invoke('refresh-rapaport-token', {
          body: { store_id: storeId, refresh_token: tokenData.refresh_token }
        });
        
        if (!refreshData?.success) {
          throw new Error('Failed to refresh token');
        }
        
        accessToken = refreshData.access_token;
      }

      // Fetch price list
      const response = await fetch(`https://apigateway.rapnetapis.com/v2/prices/${listType}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${listType} prices`);
      }

      const priceData = await response.json();

      // Save to database
      const { error: saveError } = await supabase
        .from('store_diamond_pricelists')
        .upsert({
          store_id: storeId,
          list_type: listType,
          fetched_at: new Date().toISOString(),
          updated_by_user_id: storeId,
          content: priceData
        });

      if (saveError) throw saveError;

      // Reload price lists
      await loadPriceLists();
      
    } catch (error) {
      console.error(`Error refreshing ${listType} price list:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPriceForStone = (shape: string, clarity: string, color: string, caratWeight: number) => {
    const listType = shape === 'BR' ? 'round' : 'fancy';
    const priceList = priceLists[listType];
    
    if (!priceList || !priceList.content) {
      return null;
    }

    const data = Array.isArray(priceList.content) ? priceList.content : priceList.content.data || [];
    
    const match = data.find((row: any) => {
      const rowClarity = row.clarity || row.Clarity;
      const rowColor = row.color || row.Color;
      const caratMin = parseFloat(row.carat_min || row.caratMin || row.CaratMin || 0);
      const caratMax = parseFloat(row.carat_max || row.caratMax || row.CaratMax || 999);
      
      return rowClarity === clarity &&
             rowColor === color &&
             caratMin < caratWeight &&
             caratWeight <= caratMax;
    });

    return match ? parseFloat(match.price_per_carat || match.pricePerCarat || match.PricePerCarat || 0) : null;
  };

  return {
    priceLists,
    loading,
    isConnected,
    refreshPriceList,
    getPriceForStone,
    loadPriceLists
  };
};