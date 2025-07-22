import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Settings, Calculator, TrendingUp, LogOut, History } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import StorePricingSettings from './StorePricingSettings';
import { QuoteFlow } from './QuoteFlow';
import { QuoteHistory } from './QuoteHistory';
import { supabase } from '@/lib/supabase';

interface MetalPrice {
  metal_type: string;
  price_per_ounce: number;
  price_per_dwt: number;
  timestamp: string;
}

const StoreDashboard: React.FC = () => {
  const { currentUser, logout } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [metalPrices, setMetalPrices] = useState<MetalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteKey, setQuoteKey] = useState(0);

  useEffect(() => {
    loadMetalPrices();
  }, []);

  const loadMetalPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('metal_prices')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      setMetalPrices(data || []);
    } catch (error) {
      console.error('Error loading metal prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getMetalDisplayName = (metalType: string) => {
    switch (metalType) {
      case 'xau': return 'Gold';
      case 'xag': return 'Silver';
      case 'xpt': return 'Platinum';
      case 'xpd': return 'Palladium';
      default: return metalType.toUpperCase();
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCreateQuote = () => {
    setQuoteKey(prev => prev + 1);
    setActiveTab('quotes');
  };

  if (!currentUser || currentUser.role !== 'store_admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in as a store admin to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {currentUser.name}'s Store
            </h1>
            <p className="text-gray-600 text-lg">Store Admin Dashboard</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default">Active</Badge>
              <span className="text-sm text-gray-500">ID: {currentUser.storeId}</span>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Create Quote</TabsTrigger>
            <TabsTrigger value="history">Quote History</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Store Status</CardTitle>
                  <Store className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">Active</div>
                  <p className="text-xs text-green-700 mt-1">Store ID: {currentUser.storeId}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Quote System</CardTitle>
                  <Calculator className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">Ready</div>
                  <p className="text-xs text-blue-700 mt-1">User: {currentUser.name}</p>
                  <Button 
                    onClick={handleCreateQuote}
                    className="mt-2 w-full"
                    size="sm"
                  >
                    Create Quote
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Metal Prices</CardTitle>
                <CardDescription>Live precious metal prices for quote calculations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading current prices...</div>
                ) : metalPrices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pricing data available. Contact system administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metalPrices.map((price) => (
                      <div key={price.metal_type} className="text-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                        <h3 className="font-semibold text-lg mb-2">{getMetalDisplayName(price.metal_type)}</h3>
                        <div className="space-y-1">
                          <div>
                            <div className="text-sm text-gray-600">Per Ounce</div>
                            <div className="text-lg font-bold">{formatPrice(price.price_per_ounce)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Per DWT</div>
                            <div className="text-base font-semibold">{formatPrice(price.price_per_dwt)}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(price.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <QuoteFlow key={quoteKey} />
          </TabsContent>

          <TabsContent value="history">
            <QuoteHistory />
          </TabsContent>

          <TabsContent value="pricing">
            <StorePricingSettings />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>View quote history and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Reports and analytics coming soon</p>
                  <p className="text-sm">Track quote history, conversion rates, and pricing trends</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StoreDashboard;
