import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { toast } from '@/components/ui/use-toast';
import { Sparkles } from 'lucide-react';

interface MeleeDetailsFormData {
  shape: string;
  color: string;
  clarity: string;
  count: number;
  totalCarat: number;
  pricePerPoint: number;
}

interface MeleeDetailsFormProps {
  onNext: () => void;
}

const meleeShapes = ['Round', 'Baguette', 'Princess', 'Marquise', 'Pear', 'Oval'];
const meleeColors = ['D-F', 'G-H', 'I-J', 'K-L', 'M-N'];
const meleeClarities = ['VVS', 'VS', 'SI1', 'SI2', 'I1'];

export const MeleeDetailsForm: React.FC<MeleeDetailsFormProps> = ({ onNext }) => {
  const { currentItem, updateCurrentItem } = useQuoteContext();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MeleeDetailsFormData>();

  const watchedTotalCarat = watch('totalCarat');
  const watchedPricePerPoint = watch('pricePerPoint');

  const calculateMeleeValue = (totalCarat: number, pricePerPoint: number) => {
    return (totalCarat * 100) * pricePerPoint;
  };

  const estimatedValue = watchedTotalCarat && watchedPricePerPoint
    ? calculateMeleeValue(watchedTotalCarat, watchedPricePerPoint)
    : 0;

  const onSubmit = (data: MeleeDetailsFormData) => {
    const meleeValue = calculateMeleeValue(data.totalCarat, data.pricePerPoint);
    
    const newMeleeGroup = {
      ...data,
      value: meleeValue,
    };

    const updatedMeleeGroups = [...(currentItem?.meleeGroups || []), newMeleeGroup];
    const meleeGroupsValue = updatedMeleeGroups.reduce((sum, group) => sum + group.value, 0);
    const centerStonesValue = currentItem?.centerStones?.reduce((sum, stone) => sum + stone.value, 0) || 0;
    const totalValue = (currentItem?.metalValue || 0) + centerStonesValue + meleeGroupsValue;

    updateCurrentItem({
      meleeGroups: updatedMeleeGroups,
      totalValue,
    });
    
    toast({
      title: 'Melee Group Added',
      description: `Melee value: $${meleeValue.toFixed(2)}`,
    });
    onNext();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Melee Stone Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Shape</Label>
              <Select onValueChange={(value) => setValue('shape', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {meleeShapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Color Range</Label>
              <Select onValueChange={(value) => setValue('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {meleeColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Clarity Range</Label>
              <Select onValueChange={(value) => setValue('clarity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select clarity" />
                </SelectTrigger>
                <SelectContent>
                  {meleeClarities.map((clarity) => (
                    <SelectItem key={clarity} value={clarity}>
                      {clarity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="count">Stone Count</Label>
              <Input
                id="count"
                type="number"
                {...register('count', { required: 'Count is required', min: 1 })}
                className={errors.count ? 'border-red-500' : ''}
              />
              {errors.count && (
                <p className="text-red-500 text-sm mt-1">{errors.count.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="totalCarat">Total Carat Weight</Label>
              <Input
                id="totalCarat"
                type="number"
                step="0.01"
                {...register('totalCarat', { required: 'Total carat is required', min: 0.01 })}
                className={errors.totalCarat ? 'border-red-500' : ''}
              />
              {errors.totalCarat && (
                <p className="text-red-500 text-sm mt-1">{errors.totalCarat.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="pricePerPoint">Price per Point ($)</Label>
              <Input
                id="pricePerPoint"
                type="number"
                step="0.01"
                {...register('pricePerPoint', { required: 'Price per point is required', min: 0 })}
                className={errors.pricePerPoint ? 'border-red-500' : ''}
              />
              {errors.pricePerPoint && (
                <p className="text-red-500 text-sm mt-1">{errors.pricePerPoint.message}</p>
              )}
            </div>
          </div>
          
          {estimatedValue > 0 && (
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-medium">Estimated Melee Value: ${estimatedValue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                Calculation: {watchedTotalCarat} ct × 100 × ${watchedPricePerPoint}/pt
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full">
            Add Melee Group
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
