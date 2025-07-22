import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceData {
  date: string;
  price_per_ounce: number;
}

interface PriceHistoryChartProps {
  data: PriceData[];
  metal: string;
  color: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, metal, color }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {metal} Price History (180 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis tickFormatter={formatPrice} />
              <Tooltip 
                labelFormatter={(label) => formatDate(label)}
                formatter={(value) => [formatPrice(Number(value)), 'Price/oz']}
              />
              <Line 
                type="monotone" 
                dataKey="price_per_ounce" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;