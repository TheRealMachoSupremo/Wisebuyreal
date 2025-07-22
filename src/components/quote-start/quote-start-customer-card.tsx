import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { toast } from '@/components/ui/use-toast';

interface CustomerFormData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface QuoteStartCustomerCardProps {
  onNext: () => void;
}

export const QuoteStartCustomerCard: React.FC<QuoteStartCustomerCardProps> = ({ onNext }) => {
  const { customerInfo, setCustomerInfo } = useQuoteContext();
  
  const {
    register,
    handleSubmit,
  } = useForm<CustomerFormData>({
    defaultValues: customerInfo || {},
    mode: 'onChange',
  });

  const onSubmit = (data: CustomerFormData) => {
    setCustomerInfo(data);
    toast({
      title: 'Customer Information Saved',
      description: 'Proceeding to item details',
    });
    onNext();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Start Quote</CardTitle>
        <p className="text-sm text-muted-foreground">Step 1 of 9</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name-input">Customer Name (Optional)</Label>
              <Input
                id="name-input"
                data-testid="name-input"
                {...register('name')}
                placeholder="Enter customer name (optional)"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-input">Phone Number</Label>
              <Input
                id="phone-input"
                data-testid="phone-input"
                type="tel"
                {...register('phone')}
                placeholder="(317) 555-1212 (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="email-input">Email Address</Label>
              <Input
                id="email-input"
                data-testid="email-input"
                type="email"
                {...register('email')}
                placeholder="customer@example.com (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="address-input">Street Address</Label>
              <Input
                id="address-input"
                data-testid="address-input"
                {...register('address')}
                placeholder="123 Main St, City, State 12345 (optional)"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            data-testid="next-button"
          >
            Next: Item Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};