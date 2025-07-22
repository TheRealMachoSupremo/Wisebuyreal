import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CachedPricing {
  pricing_basis: string;
  discount: number;
  metal_prices: any[];
  last_updated: string;
}

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  timestamp: string;
}

export const usePricingCache = (storeId: string | undefined) => {
  const [cachedPricing, setCachedPricing] = useState<CachedPricing | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCachedPricing = async () => {
    if (!storeId) return;
    
    try {
      const cacheKey = `pricing_${storeId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setCachedPricing(parsedCache);
      }
    } catch (error) {
      console.error('Error loading cached pricing:', error);
    }
  };

  const updatePricingCache = async (settings: { pricing_basis: string; discount: number }) => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      // Fetch current metal prices based on pricing basis
      const metalPrices = await fetchMetalPrices(settings.pricing_basis);
      
      const cacheData: CachedPricing = {
        pricing_basis: settings.pricing_basis,
        discount: settings.discount,
        metal_prices: metalPrices,
        last_updated: new Date().toISOString()
      };
      
      // Save to localStorage
      const cacheKey = `pricing_${storeId}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      setCachedPricing(cacheData);
    } catch (error) {
      console.error('Error updating pricing cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetalPrices = async (pricingBasis: string): Promise<MetalPrice[]> => {
    try {
      if (pricingBasis === 'YEOB') {
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .order('date', { ascending: false })
          .limit(4);
        
        if (error) throw error;
        
        return (data || []).map(item => ({
          metal_type: item.metal_type,
          price_per_ounce: item.price_per_ounce,
          price_per_dwt: item.price_per_dwt,
          timestamp: item.date
        }));
      } else {
        const metals = ['XAU', 'XAG', 'XPT', 'XPD'];
        const results: MetalPrice[] = [];
        
        for (const metal of metals) {
          const daysBack = pricingBasis === '90_days' ? 90 : 180;
          const { data: priceData } = await supabase
            .from('price_history')
            .select('price_per_ounce')
            .eq('metal_type', metal)
            .gte('date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('date', { ascending: false });
          
          if (priceData && priceData.length > 0) {
            const avgPrice = priceData.reduce((sum, item) => sum + item.price_per_ounce, 0) / priceData.length;
            results.push({
              metal_type: metal,
              price_per_ounce: avgPrice,
              price_per_dwt: avgPrice / 20,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        return results;
      }
    } catch (error) {
      console.error('Error fetching metal prices:', error);
      return [];
    }
  };

  const clearCache = () => {
    if (!storeId) return;
    
    const cacheKey = `pricing_${storeId}`;
    localStorage.removeItem(cacheKey);
    setCachedPricing(null);
  };

  useEffect(() => {
    loadCachedPricing();
  }, [storeId]);

  return {
    cachedPricing,
    loading,
    updatePricingCache,
    clearCache
  };
};
