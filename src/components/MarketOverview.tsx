import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { usePricingCache } from '@/hooks/usePricingCache';
import MetalPurityCard from './MetalPurityCard';

interface MetalTrend {
  metal_type: string;
  metal_name: string;
  avg_90_days: number;
  avg_180_days: number;
  yeob_price: number;
  trend_percent: number;
  data_days: number;
}

const METAL_NAMES = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium'
};

const MarketOverview: React.FC = () => {
  const { currentStore } = useAppContext();
  const { cachedPricing } = usePricingCache(currentStore?.id);
  const [trends, setTrends] = useState<MetalTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const metalPurities = {
    XAU: [
      { purity: '9K', percentage: 37.5 },
      { purity: '10K', percentage: 41.7 },
      { purity: '14K', percentage: 58.3 },
      { purity: '18K', percentage: 75.0 },
      { purity: '22K', percentage: 91.7 },
      { purity: '24K', percentage: 99.9 }
    ],
    XAG: [
      { purity: '.999', percentage: 99.9 },
      { purity: '.925', percentage: 92.5 }
    ],
    XPT: [
      { purity: '950', percentage: 95.0 },
      { purity: '900', percentage: 90.0 },
      { purity: '850', percentage: 85.0 }
    ],
    XPD: [
      { purity: '950', percentage: 95.0 },
      { purity: '900', percentage: 90.0 },
      { purity: '800', percentage: 80.0 }
    ]
  };

  useEffect(() => {
    loadMarketTrends();
  }, []);

  const loadMarketTrends = async () => {
    try {
      const metals = ['XAU', 'XAG', 'XPT', 'XPD'];
      const results: MetalTrend[] = [];

      for (const metal of metals) {
        const { data: priceData } = await supabase
          .from('price_history')
          .select('price_per_ounce, date')
          .eq('metal_type', metal)
          .gte('date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (priceData && priceData.length > 0) {
          const dataCount = priceData.length;
          const last90Days = priceData.slice(0, Math.min(90, dataCount));
          const allData = priceData;
          const yeobPrice = priceData[0]?.price_per_ounce || 0;

          const avg90 = last90Days.reduce((sum, item) => sum + item.price_per_ounce, 0) / last90Days.length;
          const avg180 = allData.reduce((sum, item) => sum + item.price_per_ounce, 0) / allData.length;
          const trendPercent = avg180 > 0 ? ((avg90 / avg180 - 1) * 100) : 0;

          results.push({
            metal_type: metal,
            metal_name: METAL_NAMES[metal as keyof typeof METAL_NAMES],
            avg_90_days: avg90,
            avg_180_days: avg180,
            yeob_price: yeobPrice,
            trend_percent: trendPercent,
            data_days: dataCount
          });
        }
      }

      setTrends(results);
    } catch (error) {
      console.error('Error loading market trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = (trend: MetalTrend) => {
    const pricingBasis = currentStore?.pricing_basis || cachedPricing?.pricing_basis || 'YEOB';
    switch (pricingBasis) {
      case '90_days':
        return trend.avg_90_days;
      case '180_days':
        return trend.avg_180_days;
      default:
        return trend.yeob_price;
    }
  };

  const calculatePurityPrices = (basePrice: number, metalType: string) => {
    const purities = metalPurities[metalType as keyof typeof metalPurities] || [];
    return purities.map(purity => ({
      ...purity,
      pricePerOz: basePrice * (purity.percentage / 100),
      pricePerDwt: (basePrice * (purity.percentage / 100)) / 20
    }));
  };

  const getPricingBasisLabel = () => {
    const pricingBasis = currentStore?.pricing_basis || cachedPricing?.pricing_basis || 'YEOB';
    switch (pricingBasis) {
      case '90_days':
        return '90-Day Average';
      case '180_days':
        return '180-Day Average';
      default:
        return 'Yesterday End of Business';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No price history data available. Please run the price history backfill first.
          </div>
        </CardContent>
      </Card>
    );
  }

  const storeDiscount = currentStore?.discount || cachedPricing?.discount || 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Prices</CardTitle>
        <p className="text-sm text-gray-600">Prices based on {getPricingBasisLabel()}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trends.map((trend) => (
            <MetalPurityCard
              key={trend.metal_type}
              metalType={trend.metal_type}
              metalName={trend.metal_name}
              basePrice={getCurrentPrice(trend)}
              purities={calculatePurityPrices(getCurrentPrice(trend), trend.metal_type)}
              overrideDiscount={storeDiscount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;