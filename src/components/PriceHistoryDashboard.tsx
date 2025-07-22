import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import PriceHistoryChart from './PriceHistoryChart';
import BackfillStatus from './BackfillStatus';
import YEOBChart from './YEOBChart';
import { supabase } from '@/lib/supabase';

interface PriceData {
  date: string;
  price_per_ounce: number;
}

const PriceHistoryDashboard: React.FC = () => {
  const [priceData, setPriceData] = useState<Record<string, PriceData[]>>({});
  const [loading, setLoading] = useState(true);
  const [averages, setAverages] = useState<Record<string, { avg90: number; avg180: number; change: number }>>({});

  const metals = [
    { code: 'XAU', name: 'Gold', color: '#FFD700' },
    { code: 'XAG', name: 'Silver', color: '#C0C0C0' },
    { code: 'XPT', name: 'Platinum', color: '#E5E4E2' },
    { code: 'XPD', name: 'Palladium', color: '#CED0DD' }
  ];

  useEffect(() => {
    fetchPriceHistory();
  }, []);

  const fetchPriceHistory = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 179);
      
      const { data, error } = await supabase
        .from('price_history')
        .select('date, metal_type, price_per_ounce')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      const groupedData: Record<string, PriceData[]> = {};
      const calculatedAverages: Record<string, { avg90: number; avg180: number; change: number }> = {};
      
      metals.forEach(metal => {
        const metalData = data?.filter(item => item.metal_type === metal.code) || [];
        groupedData[metal.code] = metalData;
        
        // Calculate averages and trends
        const prices = metalData.map(item => item.price_per_ounce);
        const avg180 = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const last90 = prices.slice(-90);
        const avg90 = last90.length > 0 ? last90.reduce((a, b) => a + b, 0) / last90.length : 0;
        
        // Calculate 30-day change
        const recent30 = prices.slice(-30);
        const previous30 = prices.slice(-60, -30);
        const recentAvg = recent30.length > 0 ? recent30.reduce((a, b) => a + b, 0) / recent30.length : 0;
        const previousAvg = previous30.length > 0 ? previous30.reduce((a, b) => a + b, 0) / previous30.length : 0;
        const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
        
        calculatedAverages[metal.code] = { avg90, avg180, change };
      });
      
      setPriceData(groupedData);
      setAverages(calculatedAverages);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillComplete = () => {
    fetchPriceHistory();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading price history...</div>;
  }

  return (
    <div className="space-y-6">
      <BackfillStatus onBackfillComplete={handleBackfillComplete} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Market Overview & Rolling Averages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metals.map(metal => {
              const avg = averages[metal.code];
              const dataCount = priceData[metal.code]?.length || 0;
              return (
                <div key={metal.code} className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{metal.name}</h3>
                    {avg && avg.change !== 0 && (
                      <Badge variant={avg.change >= 0 ? 'default' : 'destructive'} className="text-xs">
                        {avg.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {avg.change.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">90-day avg:</span>
                      <span className="font-medium">{formatPrice(avg?.avg90 || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">180-day avg:</span>
                      <span className="font-medium">{formatPrice(avg?.avg180 || 0)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {dataCount} days of data
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="yeob" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="yeob">YEOB</TabsTrigger>
          <TabsTrigger value="history">Historical Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="yeob">
          <YEOBChart />
        </TabsContent>
        
        <TabsContent value="history">
          <Tabs defaultValue="XAU" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {metals.map(metal => (
                <TabsTrigger key={metal.code} value={metal.code}>
                  {metal.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {metals.map(metal => (
              <TabsContent key={metal.code} value={metal.code}>
                <PriceHistoryChart 
                  data={priceData[metal.code] || []}
                  metal={metal.name}
                  color={metal.color}
                />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PriceHistoryDashboard;