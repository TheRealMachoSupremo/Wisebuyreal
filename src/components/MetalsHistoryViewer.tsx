import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HistoricalPrice {
  id: string;
  metal_type: string;
  date: string;
  price_per_ounce: number;
  price_per_dwt: number;
  timestamp: string;
}

const MetalsHistoryViewer: React.FC = () => {
  const [selectedMetal, setSelectedMetal] = useState('XAU');
  const [historyData, setHistoryData] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [refreshing, setRefreshing] = useState(false);
  const [priceStats, setPriceStats] = useState<{min: number, max: number, avg: number} | null>(null);

  const metals = [
    { code: 'XAU', name: 'Gold', color: '#FFD700' },
    { code: 'XPT', name: 'Platinum', color: '#E5E4E2' },
    { code: 'XAG', name: 'Silver', color: '#C0C0C0' },
    { code: 'XPD', name: 'Palladium', color: '#CED0DD' }
  ];

  useEffect(() => {
    loadHistoryData();
  }, [selectedMetal]);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('metal_type', selectedMetal)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      const processedData = (data || []).map(item => ({
        ...item,
        id: item.date + item.metal_type,
        timestamp: item.date
      }));
      
      setHistoryData(processedData);
      
      // Calculate statistics
      if (processedData.length > 0) {
        const prices = processedData.map(item => item.price_per_dwt);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        setPriceStats({ min, max, avg });
      } else {
        setPriceStats(null);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistoryData = async () => {
    setRefreshing(true);
    try {
      await loadHistoryData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Metal', 'Price per Ounce', 'Price per DWT'],
      ...historyData.map(item => [
        item.date,
        item.metal_type,
        item.price_per_ounce.toString(),
        item.price_per_dwt.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMetal}_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = historyData.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    price: item.price_per_dwt,
    ouncePrice: item.price_per_ounce,
    fullDate: item.date
  }));

  const currentMetal = metals.find(m => m.code === selectedMetal);
  const dataCount = historyData.length;
  const latestPrice = historyData[historyData.length - 1];
  const oldestPrice = historyData[0];
  const priceChange = latestPrice && oldestPrice ? 
    ((latestPrice.price_per_dwt - oldestPrice.price_per_dwt) / oldestPrice.price_per_dwt) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Metals Price History ({dataCount} Days)
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={refreshHistoryData} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={exportData} variant="outline" size="sm" disabled={dataCount === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        {latestPrice && priceStats && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Latest: {formatPrice(latestPrice.price_per_dwt)} per DWT</span>
            <Badge variant={priceChange >= 0 ? 'default' : 'destructive'}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% ({dataCount} days)
            </Badge>
            <span>Range: {formatPrice(priceStats.min)} - {formatPrice(priceStats.max)}</span>
            <span>Avg: {formatPrice(priceStats.avg)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            {metals.map(metal => (
              <Button
                key={metal.code}
                variant={selectedMetal === metal.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetal(metal.code)}
              >
                {metal.name}
              </Button>
            ))}
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'chart' | 'table')}>
            <TabsList>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading chart data...
                </div>
              ) : dataCount === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No historical data available for {currentMetal?.name}. Price history backfill may be needed.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Price per DWT']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke={currentMetal?.color || '#8884d8'} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="table">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading table data...
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Price per Ounce</TableHead>
                        <TableHead>Price per DWT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                            No historical data available. Price history backfill may be needed.
                          </TableCell>
                        </TableRow>
                      ) : (
                        historyData.slice().reverse().map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell>{formatPrice(item.price_per_ounce)}</TableCell>
                            <TableCell>{formatPrice(item.price_per_dwt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetalsHistoryViewer;