import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  timestamp: string;
}

interface StoreSettings {
  pricing_basis: string;
  discount: number;
}

export const useStorePricing = () => {
  const { currentStore } = useAppContext();
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ pricing_basis: 'YEOB', discount: 10 });
  const [metalPrices, setMetalPrices] = useState<MetalPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore) {
      setStoreSettings({
        pricing_basis: currentStore.pricing_basis || 'YEOB',
        discount: currentStore.discount || 10
      });
      loadMetalPrices();
    }
  }, [currentStore]);

  const loadMetalPrices = async () => {
    if (!currentStore) return;
    
    setLoading(true);
    try {
      const basis = currentStore.pricing_basis || 'YEOB';
      
      if (basis === 'YEOB') {
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .order('date', { ascending: false })
          .limit(4);
        
        if (error) throw error;
        
        const formattedData = (data || []).map(item => ({
          metal_type: item.metal_type,
          price_per_ounce: item.price_per_ounce,
          price_per_dwt: item.price_per_dwt,
          timestamp: item.date
        }));
        
        setMetalPrices(formattedData);
      } else {
        const metals = ['XAU', 'XAG', 'XPT', 'XPD'];
        const results: MetalPrice[] = [];
        
        for (const metal of metals) {
          const daysBack = basis === '90_days' ? 90 : 180;
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
        
        setMetalPrices(results);
      }
    } catch (error) {
      console.error('Error loading metal prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (basePrice: number) => {
    const discount = currentStore?.discount || 10;
    return basePrice * (1 - discount / 100);
  };

  const getMetalPrice = (metalType: string, purity: string) => {
    const metalMap: { [key: string]: string } = {
      gold: 'XAU',
      silver: 'XAG', 
      platinum: 'XPT',
      palladium: 'XPD'
    };
    
    const metalCode = metalMap[metalType.toLowerCase()];
    const metalPrice = metalPrices.find(p => p.metal_type === metalCode);
    
    if (!metalPrice) return 0;
    
    const purityMultipliers: { [key: string]: number } = {
      '24K (99.9%)': 0.999, '22K (91.7%)': 0.917, '18K (75%)': 0.75,
      '14K (58.3%)': 0.583, '10K (41.7%)': 0.417, '9K (37.5%)': 0.375,
      '.999 (99.9%)': 0.999, '.925 (92.5%)': 0.925, '.950 (95%)': 0.95, 
      '.900 (90%)': 0.9, '.500 (50%)': 0.5
    };
    
    const purityDecimal = purityMultipliers[purity] || 0;
    const basePrice = metalPrice.price_per_dwt * purityDecimal;
    
    return calculateDiscountedPrice(basePrice);
  };

  return {
    storeSettings,
    metalPrices,
    loading,
    getMetalPrice,
    calculateDiscountedPrice,
    loadMetalPrices
  };
};