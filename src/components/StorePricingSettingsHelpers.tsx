import { supabase } from '@/lib/supabase';

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  timestamp: string;
}

export const loadCurrentPrices = async (pricingBasis: string, cachedPricing: any): Promise<MetalPrice[]> => {
  try {
    // Use cached pricing if available
    if (cachedPricing && cachedPricing.metal_prices) {
      return cachedPricing.metal_prices;
    }

    // Load fresh data based on pricing basis
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
    console.error('Error loading current prices:', error);
    return [];
  }
};

export const getPricingBasisLabel = (basis: string) => {
  switch (basis) {
    case 'YEOB': return 'YEOB (Yesterday End of Business)';
    case '90_days': return '90-Day Average';
    case '180_days': return '180-Day Average';
    default: return 'YEOB (Yesterday End of Business)';
  }
};

export const getMetalName = (metalType: string) => {
  const names = {
    XAU: 'Gold',
    XAG: 'Silver',
    XPT: 'Platinum',
    XPD: 'Palladium'
  };
  return names[metalType as keyof typeof names] || metalType.toUpperCase();
};

export const calculatePurityPrices = (basePrice: number, metalType: string, metalPurities: any) => {
  const purities = metalPurities[metalType as keyof typeof metalPurities] || [];
  return purities.map((purity: any) => {
    const adjustedPrice = basePrice * (purity.percentage / 100);
    return {
      ...purity,
      pricePerOz: adjustedPrice,
      pricePerDwt: adjustedPrice / 20
    };
  });
};