import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ManualPriceEntryProps {
  onPriceSet: (pricePerCarat: number) => void;
  onCancel: () => void;
}

interface FormData {
  pricePerCarat: number;
}

const ManualPriceEntry: React.FC<ManualPriceEntryProps> = ({ onPriceSet, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    onPriceSet(data.pricePerCarat);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          Manual Price Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-800">
              No automatic pricing available. Please enter the price per carat manually.
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="pricePerCarat">Price Per Carat ($)</Label>
              <Input
                id="pricePerCarat"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter price per carat"
                {...register('pricePerCarat', {
                  required: 'Price per carat is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
                className={errors.pricePerCarat ? 'border-red-500' : ''}
              />
              {errors.pricePerCarat && (
                <p className="text-red-500 text-sm mt-1">{errors.pricePerCarat.message}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Set Price
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPriceEntry;