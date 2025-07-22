import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { toast } from '@/components/ui/use-toast';
import { Gem, AlertTriangle, Loader2 } from 'lucide-react';
import { useDiamondPricing } from '@/hooks/useDiamondPricing';
import ManualPriceEntry from './ManualPriceEntry';

interface StoneDetailsFormData {
  cut: string;
  clarity: string;
  color: string;
  shape: string;
  carat: number;
  percentOff: number;
  gradingLab: string;
  inscription?: string;
}

interface StoneDetailsFormProps {
  onNext: () => void;
}

const cuts = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const clarities = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
const colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const shapes = ['Round', 'Princess', 'Emerald', 'Asscher', 'Oval', 'Radiant', 'Cushion', 'Pear', 'Heart', 'Marquise'];
const gradingLabs = ['GIA', 'AGS', 'EGL', 'GCAL', 'Other', 'None'];

export const StoneDetailsForm: React.FC<StoneDetailsFormProps> = ({ onNext }) => {
  const { currentItem, updateCurrentItem, storeId } = useQuoteContext();
  const { getDiamondPrice, calculateCenterStoneValue, useDevPricing, loading: pricingLoading } = useDiamondPricing();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [pricePerCarat, setPricePerCarat] = useState<number | null>(null);
  const [pricingSource, setPricingSource] = useState<string>('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [formComplete, setFormComplete] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoneDetailsFormData>();

  const watchedValues = watch(['carat', 'color', 'clarity', 'shape', 'cut', 'gradingLab']);
  const [watchedCarat, watchedColor, watchedClarity, watchedShape, watchedCut, watchedGradingLab] = watchedValues;
  const watchedPercentOff = watch('percentOff');

  useEffect(() => {
    const isComplete = watchedCarat && watchedColor && watchedClarity && watchedShape && watchedCut && watchedGradingLab;
    setFormComplete(!!isComplete);
  }, [watchedCarat, watchedColor, watchedClarity, watchedShape, watchedCut, watchedGradingLab]);

  useEffect(() => {
    if (formComplete && !pricingLoading && !isLoadingPrice) {
      fetchPrice();
    }
  }, [formComplete, pricingLoading]);

  const fetchPrice = async () => {
    if (!watchedCarat || !watchedColor || !watchedClarity || !watchedShape) return;
    
    setIsLoadingPrice(true);
    setPricingError(null);
    
    try {
      const result = await getDiamondPrice({
        shape: watchedShape,
        color: watchedColor,
        clarity: watchedClarity,
        carat: watchedCarat
      }, storeId);

      if (result.pricePerCarat) {
        setPricePerCarat(result.pricePerCarat);
        setPricingSource(result.source);
        setShowManualEntry(false);
        setPricingError(null);
      } else {
        setPricePerCarat(null);
        setPricingSource(result.source || 'not_found');
        setPricingError(result.error || 'No pricing data available');
      }
    } catch (error) {
      console.error('Error fetching diamond price:', error);
      setPricingError('Failed to fetch pricing');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleManualPrice = (manualPrice: number) => {
    setPricePerCarat(manualPrice);
    setShowManualEntry(false);
    setPricingSource('manual');
    setPricingError(null);
  };

  const estimatedValue = watchedCarat && pricePerCarat && watchedPercentOff !== undefined
    ? calculateCenterStoneValue(watchedCarat, pricePerCarat, watchedPercentOff)
    : 0;

  const onSubmit = (data: StoneDetailsFormData) => {
    if (!pricePerCarat) {
      if (formComplete && (pricingError || pricingSource === 'not_found')) {
        setShowManualEntry(true);
        return;
      }
      toast({
        title: 'Price Required',
        description: 'Please complete all fields to get pricing',
        variant: 'destructive'
      });
      return;
    }

    const stoneValue = calculateCenterStoneValue(data.carat, pricePerCarat, data.percentOff);
    
    const newStone = {
      ...data,
      pricePerCarat,
      pricingSource,
      value: stoneValue,
    };

    const updatedCenterStones = [...(currentItem?.centerStones || []), newStone];
    const centerStonesValue = updatedCenterStones.reduce((sum, stone) => sum + stone.value, 0);
    const totalValue = (currentItem?.metalValue || 0) + centerStonesValue + 
                      (currentItem?.meleeGroups?.reduce((sum, group) => sum + group.value, 0) || 0);

    updateCurrentItem({
      centerStones: updatedCenterStones,
      totalValue,
    });
    
    toast({
      title: 'Center Stone Added',
      description: `Stone value: $${stoneValue.toFixed(2)}`,
    });
    onNext();
  };

  if (showManualEntry && formComplete) {
    return (
      <ManualPriceEntry
        onPriceSet={handleManualPrice}
        onCancel={() => setShowManualEntry(false)}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5" />
          Center Stone Details
        </CardTitle>
        {useDevPricing && (
          <Badge variant="secondary" className="w-fit">
            Development Pricing Mode
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Shape *</Label>
              <Select onValueChange={(value) => setValue('shape', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Cut *</Label>
              <Select onValueChange={(value) => setValue('cut', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cut" />
                </SelectTrigger>
                <SelectContent>
                  {cuts.map((cut) => (
                    <SelectItem key={cut} value={cut}>
                      {cut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Color *</Label>
              <Select onValueChange={(value) => setValue('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Clarity *</Label>
              <Select onValueChange={(value) => setValue('clarity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select clarity" />
                </SelectTrigger>
                <SelectContent>
                  {clarities.map((clarity) => (
                    <SelectItem key={clarity} value={clarity}>
                      {clarity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carat">Carat Weight *</Label>
              <Input
                id="carat"
                type="number"
                step="0.01"
                {...register('carat', { required: 'Carat weight is required', min: 0.01 })}
              />
            </div>
            
            <div>
              <Label htmlFor="percentOff">Discount (%)</Label>
              <Input
                id="percentOff"
                type="number"
                step="0.1"
                defaultValue={0}
                {...register('percentOff', { required: 'Discount is required', min: 0, max: 100 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Grading Lab *</Label>
              <Select onValueChange={(value) => setValue('gradingLab', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lab" />
                </SelectTrigger>
                <SelectContent>
                  {gradingLabs.map((lab) => (
                    <SelectItem key={lab} value={lab}>
                      {lab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="inscription">Inscription (Optional)</Label>
              <Input id="inscription" {...register('inscription')} />
            </div>
          </div>
          
          {!formComplete && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please fill in all required fields marked with * to get pricing
              </p>
            </div>
          )}
          
          {(isLoadingPrice || pricingLoading) && formComplete && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm text-gray-600">Loading pricing data...</p>
            </div>
          )}
          
          {pricingError && !isLoadingPrice && formComplete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">Pricing Error</span>
              </div>
              <p className="text-sm text-red-700">{pricingError}</p>
            </div>
          )}
          
          {pricePerCarat && !isLoadingPrice && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Price Per Carat: ${pricePerCarat.toLocaleString()}</span>
                <Badge variant={pricingSource === 'dev_csv' ? 'secondary' : 'outline'}>
                  {pricingSource === 'dev_csv' ? 'Dev CSV' : pricingSource}
                </Badge>
              </div>
              {estimatedValue > 0 && (
                <p className="text-sm text-blue-700">
                  Estimated Stone Value: ${estimatedValue.toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!formComplete || isLoadingPrice}>
              {pricePerCarat ? 'Add Stone' : 'Get Pricing & Add Stone'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};