import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { useStoreDiamondPricing } from '@/hooks/useStoreDiamondPricing';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const StoreDiamondPricingPanel: React.FC = () => {
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const {
    priceLists,
    loading,
    refreshPriceList,
    isConnected
  } = useStoreDiamondPricing(currentUser?.storeId || '');

  const handleRefresh = async (listType: 'round' | 'fancy') => {
    try {
      await refreshPriceList(listType);
      toast({
        title: 'Success',
        description: `${listType} price list refreshed successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to refresh ${listType} price list`,
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isOutdated = (dateString: string) => {
    const fetchDate = new Date(dateString);
    const now = new Date();
    const daysDiff = (now.getTime() - fetchDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 30;
  };

  const downloadCSV = (listType: 'round' | 'fancy') => {
    const priceList = priceLists[listType];
    if (!priceList || !priceList.content) return;

    const data = Array.isArray(priceList.content) ? priceList.content : priceList.content.data || [];
    
    const headers = ['shape', 'clarity', 'color', 'carat_min', 'carat_max', 'price_per_carat'];
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => [
        row.shape || '',
        row.clarity || '',
        row.color || '',
        row.carat_min || row.caratMin || '',
        row.carat_max || row.caratMax || '',
        row.price_per_carat || row.pricePerCarat || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${listType}-diamonds-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderPriceTable = (listType: 'round' | 'fancy') => {
    const priceList = priceLists[listType];
    if (!priceList || !priceList.content) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {listType} pricing data available
        </div>
      );
    }

    const data = Array.isArray(priceList.content) ? priceList.content : priceList.content.data || [];
    const displayData = data.slice(0, 25);
    const outdated = isOutdated(priceList.fetched_at);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Last updated:</span>
              <span className="text-sm text-gray-600">{formatDate(priceList.fetched_at)}</span>
              {outdated && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Outdated
                </Badge>
              )}
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? (
                <><CheckCircle className="w-3 h-3 mr-1" />Connected to Rapaport</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" />Not Connected</>
              )}
            </Badge>
            {outdated && (
              <p className="text-sm text-amber-600">
                ⚠️ Your price list may be outdated. Please refresh.
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => downloadCSV(listType)}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => handleRefresh(listType)}
              disabled={loading || !isConnected}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Price List
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shape</TableHead>
                <TableHead>Clarity</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Carat Min</TableHead>
                <TableHead>Carat Max</TableHead>
                <TableHead>Price/Carat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{row.shape || 'N/A'}</TableCell>
                  <TableCell>{row.clarity || 'N/A'}</TableCell>
                  <TableCell>{row.color || 'N/A'}</TableCell>
                  <TableCell>{row.carat_min || row.caratMin || 'N/A'}</TableCell>
                  <TableCell>{row.carat_max || row.caratMax || 'N/A'}</TableCell>
                  <TableCell>${row.price_per_carat || row.pricePerCarat || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {data.length > 25 && (
          <p className="text-sm text-gray-500 text-center">
            Showing first 25 of {data.length} records
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Store Diamond Pricing</span>
        </CardTitle>
        <CardDescription>
          View and manage your store's Rapaport diamond price lists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="round" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="round">Round Pricing</TabsTrigger>
            <TabsTrigger value="fancy">Fancy Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="round" className="mt-6">
            {renderPriceTable('round')}
          </TabsContent>
          
          <TabsContent value="fancy" className="mt-6">
            {renderPriceTable('fancy')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoreDiamondPricingPanel;