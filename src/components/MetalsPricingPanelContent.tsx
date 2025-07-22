import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  last_updated: string;
}

interface MetalsPricingPanelContentProps {
  prices: MetalPrice[];
}

const MetalsPricingPanelContent: React.FC<MetalsPricingPanelContentProps> = ({ prices = [] }) => {
  const [historicalData, setHistoricalData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('date, metal_type, price_per_ounce')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      const grouped = (data || []).reduce((acc, item) => {
        if (!acc[item.metal_type]) acc[item.metal_type] = [];
        acc[item.metal_type].push({
          date: new Date(item.date).toLocaleDateString(),
          price: item.price_per_ounce
        });
        return acc;
      }, {} as Record<string, any[]>);
      
      setHistoricalData(grouped);
    } catch (error) {
      console.error('Error fetching recent history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getMetalColor = (metalType: string) => {
    const colors: Record<string, string> = {
      'XAU': '#FFD700',
      'XAG': '#C0C0C0', 
      'XPT': '#E5E4E2',
      'XPD': '#CED0DD'
    };
    return colors[metalType?.toUpperCase()] || '#8884d8';
  };

  const getMetalName = (metalType: string) => {
    const names: Record<string, string> = {
      'XAU': 'Gold',
      'XAG': 'Silver',
      'XPT': 'Platinum', 
      'XPD': 'Palladium'
    };
    return names[metalType?.toUpperCase()] || metalType?.toUpperCase() || 'Unknown';
  };

  const getPriceChange = (metalType: string) => {
    const history = historicalData[metalType?.toUpperCase()];
    if (!history || history.length < 2) return null;
    
    const latest = history[history.length - 1]?.price;
    const previous = history[history.length - 2]?.price;
    
    if (!latest || !previous) return null;
    
    const change = ((latest - previous) / previous) * 100;
    return change;
  };

  if (!prices || prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>No pricing data available. Run a manual sync to fetch current prices.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {prices.map((price) => {
          if (!price || !price.metal_type) return null;
          
          const change = getPriceChange(price.metal_type);
          const metalName = getMetalName(price.metal_type);
          
          return (
            <Card key={price.metal_type} className="bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{metalName}</h3>
                    {change !== null && (
                      <Badge variant={change >= 0 ? 'default' : 'destructive'} className="text-xs">
                        {change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {change.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-600">Per Ounce</div>
                      <div className="text-xl font-bold">{formatPrice(price.price_per_ounce || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Per DWT</div>
                      <div className="text-lg font-semibold">{formatPrice(price.price_per_dwt || 0)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Updated: {price.last_updated ? new Date(price.last_updated).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prices.slice(0, 4).map((price) => {
            if (!price || !price.metal_type) return null;
            
            const history = historicalData[price.metal_type.toUpperCase()];
            const metalName = getMetalName(price.metal_type);
            const color = getMetalColor(price.metal_type);
            
            return (
              <Card key={`chart-${price.metal_type}`}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{metalName} - 7 Day Trend</h4>
                  {history && history.length > 0 ? (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: number) => [formatPrice(value), 'Price/oz']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke={color} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                      No recent history available
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetalsPricingPanelContent;