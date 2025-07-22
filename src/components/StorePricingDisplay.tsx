import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PricingMethod {
  name: string;
  value: number;
  change: number;
  period: string;
}

interface StorePricingDisplayProps {
  storeId: string;
  storeName: string;
  pricingMethods: PricingMethod[];
  saveDiscount: number;
}

const StorePricingDisplay: React.FC<StorePricingDisplayProps> = ({
  storeId,
  storeName,
  pricingMethods,
  saveDiscount
}) => {
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{storeName} Pricing Methods</h3>
        <Badge variant="outline" className="bg-blue-50">
          Store ID: {storeId.slice(0, 8)}...
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricingMethods.map((method) => (
          <Card key={method.name} className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {method.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  ${method.value.toFixed(2)}
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(method.change)}
                  <span className={`text-sm font-medium ${getTrendColor(method.change)}`}>
                    {method.change > 0 ? '+' : ''}{method.change.toFixed(2)}%
                  </span>
                  <span className="text-xs text-gray-500">({method.period})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800">
            Save Discount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {saveDiscount}%
          </div>
          <p className="text-sm text-green-700 mt-1">
            Additional discount applied to customer purchases
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorePricingDisplay;