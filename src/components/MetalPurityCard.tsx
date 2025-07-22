import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { usePricingCache } from '@/hooks/usePricingCache';

interface Purity {
  purity: string;
  percentage: number;
  pricePerOz: number;
  pricePerDwt: number;
}

interface MetalPurityCardProps {
  metalType: string;
  metalName: string;
  basePrice: number;
  purities: Purity[];
  overrideDiscount?: number;
}

const MetalPurityCard: React.FC<MetalPurityCardProps> = ({
  metalType,
  metalName,
  basePrice,
  purities,
  overrideDiscount
}) => {
  const { currentStore } = useAppContext();
  const { cachedPricing } = usePricingCache(currentStore?.id);
  
  // Use override discount first, then cached discount, then store discount
  const discount = overrideDiscount ?? cachedPricing?.discount ?? currentStore?.discount ?? 10;

  const applyDiscount = (price: number) => {
    return price * (1 - discount / 100);
  };

  const getMetalColor = (metalType: string) => {
    const colors = {
      XAU: 'bg-yellow-100 text-yellow-800',
      XAG: 'bg-gray-100 text-gray-800',
      XPT: 'bg-blue-100 text-blue-800',
      XPD: 'bg-purple-100 text-purple-800'
    };
    return colors[metalType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{metalName}</span>
          <Badge className={getMetalColor(metalType)}>
            {metalType}
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600">
          Base: ${basePrice.toFixed(2)}/oz
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {purities.map((purity) => {
          const discountedPricePerOz = applyDiscount(purity.pricePerOz);
          const discountedPricePerDwt = applyDiscount(purity.pricePerDwt);
          
          return (
            <div key={purity.purity} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">{purity.purity}</div>
                <div className="text-xs text-gray-500">{purity.percentage}%</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">${discountedPricePerOz.toFixed(2)}/oz</div>
                <div className="text-xs text-gray-600">${discountedPricePerDwt.toFixed(2)}/dwt</div>
              </div>
            </div>
          );
        })}
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          Prices include {discount}% store discount
          {cachedPricing && !overrideDiscount && ' (cached)'}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetalPurityCard;