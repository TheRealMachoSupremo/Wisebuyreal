import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { usePricingCache } from '@/hooks/usePricingCache';
import MetalPurityCard from './MetalPurityCard';

const StorePricingSettings: React.FC = () => {
  const { toast } = useToast();
  const { currentStore } = useAppContext();
  const { cachedPricing, updatePricingCache } = usePricingCache(currentStore?.id);
  const [settings, setSettings] = useState({ pricing_basis: 'YEOB', discount: 10 });
  const [currentPrices, setCurrentPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (currentStore) loadStoreSettings();
  }, [currentStore]);

  useEffect(() => {
    loadCurrentPrices();
  }, [settings.pricing_basis]);

  const loadStoreSettings = async () => {
    if (!currentStore) return;
    try {
      const { data } = await supabase.from('stores').select('pricing_basis, discount').eq('id', currentStore.id).single();
      if (data) setSettings({ pricing_basis: data.pricing_basis || 'YEOB', discount: data.discount || 10 });
    } catch (error) {
      console.error('Error loading store settings:', error);
    }
  };

  const loadCurrentPrices = async () => {
    try {
      if (cachedPricing?.metal_prices) {
        setCurrentPrices(cachedPricing.metal_prices);
        return;
      }
      const { data } = await supabase.from('price_history').select('*').order('date', { ascending: false }).limit(4);
      setCurrentPrices(data || []);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const updateSettings = async () => {
    if (!currentStore) return;
    setLoading(true);
    try {
      await supabase.from('stores').update({ pricing_basis: settings.pricing_basis, discount: settings.discount }).eq('id', currentStore.id);
      await updatePricingCache(settings);
      toast({ title: 'Settings updated successfully' });
    } catch (error) {
      toast({ title: 'Error updating settings', variant: 'destructive' });
    } finally {
      setLoading(false);
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

  const getMetalName = (metalType: string) => {
    const names = {
      XAU: 'Gold',
      XAG: 'Silver',
      XPT: 'Platinum',
      XPD: 'Palladium'
    };
    return names[metalType as keyof typeof names] || metalType;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="w-5 h-5 mr-2" />Pricing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Pricing Basis</Label>
            <Select value={settings.pricing_basis} onValueChange={(value) => setSettings(prev => ({ ...prev, pricing_basis: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="YEOB">YEOB (Yesterday End of Business)</SelectItem>
                <SelectItem value="90_days">90-Day Average</SelectItem>
                <SelectItem value="180_days">180-Day Average</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div>
            <Label>Store Discount (%)</Label>
            <Input type="number" value={settings.discount} onChange={(e) => setSettings(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} />
          </div>
          <Button onClick={updateSettings} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Pricing Settings'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="w-5 h-5 mr-2" />Market Prices</CardTitle>
          <CardDescription>Prices based on {settings.pricing_basis === 'YEOB' ? 'Yesterday End of Business' : settings.pricing_basis === '90_days' ? '90-Day Average' : '180-Day Average'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPrices.slice(0, 4).map((price) => (
              <MetalPurityCard
                key={price.metal_type}
                metalType={price.metal_type}
                metalName={getMetalName(price.metal_type)}
                basePrice={price.price_per_ounce}
                purities={calculatePurityPrices(price.price_per_ounce, price.metal_type)}
                overrideDiscount={settings.discount}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorePricingSettings;