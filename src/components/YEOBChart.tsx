import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface YEOBPriceData {
  metal_type: string;
  price_per_ounce: string;
  price_per_dwt: string;
  date: string;
}

interface ChartData {
  time: string;
  price: number;
  metal: string;
}

const YEOBChart: React.FC = () => {
  const [yeobData, setYeobData] = useState<YEOBPriceData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetal, setSelectedMetal] = useState('XAU');

  const metals = [
    { code: 'XAU', name: 'Gold', color: '#FFD700' },
    { code: 'XAG', name: 'Silver', color: '#C0C0C0' },
    { code: 'XPT', name: 'Platinum', color: '#E5E4E2' },
    { code: 'XPD', name: 'Palladium', color: '#CED0DD' }
  ];

  useEffect(() => {
    fetchYEOBData();
  }, []);

  const fetchYEOBData = async () => {
    try {
      // Get last 7 days of data for chart
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .gte('date', weekAgoStr)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setYeobData(data || []);
      
      // Transform data for chart
      const transformedData = (data || []).map(item => ({
        time: new Date(item.date).toLocaleDateString(),
        price: parseFloat(item.price_per_dwt),
        metal: item.metal_type
      }));
      
      setChartData(transformedData);
    } catch (error) {
      console.error('Error fetching YEOB data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMostCurrentPrice = (metalCode: string) => {
    // Get all prices for this metal and sort by date (most recent first)
    const metalPrices = yeobData.filter(item => item.metal_type === metalCode);
    if (metalPrices.length === 0) return null;
    
    const sortedPrices = metalPrices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedPrices[0]; // Return the most current entry
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numPrice);
  };

  const selectedMetalData = metals.find(m => m.code === selectedMetal);
  const currentPrice = getMostCurrentPrice(selectedMetal);
  const filteredChartData = chartData.filter(item => item.metal === selectedMetal);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          Loading YEOB pricing data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metals.map(metal => {
          const price = getMostCurrentPrice(metal.code);
          
          return (
            <Card 
              key={metal.code} 
              className={`cursor-pointer transition-all ${
                selectedMetal === metal.code ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedMetal(metal.code)}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-lg">{metal.name}</h3>
                {price ? (
                  <div className="space-y-1">
                    <div className="text-xl font-bold">
                      {formatPrice(price.price_per_dwt)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(price.price_per_ounce)}/oz
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(price.date).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No data</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>YEOB {selectedMetalData?.name} Pricing</span>
            {currentPrice && (
              <Badge variant="outline">
                Most Current: {new Date(currentPrice.date).toLocaleDateString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatPrice(value), 'Price/DWT']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={selectedMetalData?.color || '#8884d8'} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No YEOB pricing data available for {selectedMetalData?.name}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default YEOBChart;