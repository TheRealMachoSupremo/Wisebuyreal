import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Camera } from 'lucide-react';
import { CameraCapture } from '../CameraCapture';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { useStorePricing } from '@/hooks/useStorePricing';
import { usePricingCache } from '@/hooks/usePricingCache';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

interface ItemDetailsFormData {
  description: string;
  metalType: string;
  metalColor: string;
  purity: string;
  weight: number;
}

interface QuoteItemDetailsCardProps {
  onNext: () => void;
}

const metalTypes = ['gold', 'silver', 'platinum', 'palladium'];
const metalColors = {
  gold: ['yellow', 'white', 'rose'],
  silver: ['white'],
  platinum: ['white'],
  palladium: ['white']
};
const purities = {
  gold: ['24K (99.9%)', '22K (91.7%)', '18K (75%)', '14K (58.3%)', '10K (41.7%)', '9K (37.5%)'],
  silver: ['.999 (99.9%)', '.925 (92.5%)'],
  platinum: ['.999 (99.9%)', '.950 (95%)', '.900 (90%)'],
  palladium: ['.999 (99.9%)', '.950 (95%)', '.500 (50%)']
};

export const QuoteItemDetailsCard: React.FC<QuoteItemDetailsCardProps> = ({ onNext }) => {
  const { currentItem, setCurrentItem, updateCurrentItem } = useQuoteContext();
  const { currentStore } = useAppContext();
  const { cachedPricing } = usePricingCache(currentStore?.id);
  const { getMetalPrice, storeSettings, loading: pricingLoading } = useStorePricing();
  const [photo, setPhoto] = useState(currentItem?.photo || '');
  const [selectedMetal, setSelectedMetal] = useState(currentItem?.metalType || '');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemDetailsFormData>({
    defaultValues: {
      description: currentItem?.description || '',
      metalType: currentItem?.metalType || '',
      metalColor: currentItem?.metalColor || '',
      purity: currentItem?.purity || '',
      weight: currentItem?.weight || 0,
    },
  });

  const watchedWeight = watch('weight');
  const watchedPurity = watch('purity');

  useEffect(() => {
    if (!currentItem) {
      const newItem = {
        id: crypto.randomUUID(),
        photo: '',
        description: '',
        metalType: '',
        metalColor: '',
        purity: '',
        weight: 0,
        metalValue: 0,
        hasCenterStone: false,
        centerStones: [],
        hasMelee: false,
        meleeGroups: [],
        totalValue: 0,
      };
      setCurrentItem(newItem);
    }
  }, [currentItem, setCurrentItem]);

  useEffect(() => {
    if (watchedWeight && watchedPurity && selectedMetal && !pricingLoading) {
      const pricePerDwt = getMetalPrice(selectedMetal, watchedPurity);
      const metalValue = watchedWeight * pricePerDwt;
      updateCurrentItem({ metalValue, totalValue: metalValue });
    }
  }, [watchedWeight, watchedPurity, selectedMetal, getMetalPrice, updateCurrentItem, pricingLoading]);

  const handlePhotoCapture = (photoBase64: string) => {
    setPhoto(photoBase64);
    setIsCameraOpen(false);
    toast({
      title: 'Photo Captured',
      description: 'Photo has been saved to the item.',
    });
  };

  const onSubmit = (data: ItemDetailsFormData) => {
    const pricePerDwt = getMetalPrice(data.metalType, data.purity);
    const metalValue = data.weight * pricePerDwt;
    
    updateCurrentItem({
      ...data,
      photo,
      metalValue,
      totalValue: metalValue,
    });
    
    const effectiveDiscount = cachedPricing?.discount ?? storeSettings.discount;
    
    toast({
      title: 'Item Details Saved',
      description: `Metal value calculated with ${effectiveDiscount}% store discount applied${cachedPricing ? ' (using cached pricing)' : ''}`,
    });
    onNext();
  };

  const getPricingBasisLabel = (basis: string) => {
    switch (basis) {
      case 'YEOB': return 'YEOB';
      case '90_days': return '90-day average';
      case '180_days': return '180-day average';
      default: return 'YEOB';
    }
  };

  const effectiveDiscount = cachedPricing?.discount ?? storeSettings.discount;
  const effectivePricingBasis = cachedPricing?.pricing_basis ?? storeSettings.pricing_basis;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item Details</span>
          {cachedPricing && (
            <Badge variant="secondary" className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Cached Pricing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div data-testid="photo-upload">
            <Label>Item Photo</Label>
            <div className="space-y-2">
              {photo && (
                <img 
                  src={photo} 
                  alt="Item photo" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
              )}
              <Button 
                type="button" 
                onClick={() => setIsCameraOpen(true)}
                variant="outline" 
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                {photo ? 'Retake Photo' : 'Take Photo'}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description-textarea">Description</Label>
            <Textarea
              id="description-textarea"
              data-testid="description-textarea"
              {...register('description', { required: 'Description is required' })}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Metal Type</Label>
              <Select onValueChange={(value) => { setSelectedMetal(value); setValue('metalType', value); }}>
                <SelectTrigger data-testid="metal-type-select">
                  <SelectValue placeholder="Select metal" />
                </SelectTrigger>
                <SelectContent>
                  {metalTypes.map((metal) => (
                    <SelectItem key={metal} value={metal}>
                      {metal.charAt(0).toUpperCase() + metal.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Color</Label>
              <Select onValueChange={(value) => setValue('metalColor', value)}>
                <SelectTrigger data-testid="metal-color-select">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMetal && metalColors[selectedMetal as keyof typeof metalColors]?.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Purity</Label>
              <Select onValueChange={(value) => setValue('purity', value)}>
                <SelectTrigger data-testid="purity-select">
                  <SelectValue placeholder="Select purity" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMetal && purities[selectedMetal as keyof typeof purities]?.map((purity) => (
                    <SelectItem key={purity} value={purity}>
                      {purity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="weight-input">Weight (DWT)</Label>
            <Input
              id="weight-input"
              data-testid="weight-input"
              type="number"
              step="0.01"
              {...register('weight', { required: 'Weight is required', min: 0.01 })}
              className={errors.weight ? 'border-red-500' : ''}
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
            )}
          </div>
          
          {currentItem?.metalValue && (
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-medium">Estimated Metal Value: ${currentItem.metalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                Price includes {effectiveDiscount}% store discount ({getPricingBasisLabel(effectivePricingBasis)} pricing)
                {cachedPricing && ' • Using cached pricing data'}
              </p>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={pricingLoading}
            data-testid="next-button"
          >
            {pricingLoading ? 'Loading prices...' : 'Continue to Stone Evaluation'}
          </Button>
        </form>
      </CardContent>
      
      <CameraCapture 
        isOpen={isCameraOpen}
        onCapture={handlePhotoCapture}
        onClose={() => setIsCameraOpen(false)}
      />
    </Card>
  );
};