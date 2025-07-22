import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { useQuoteStorage } from './QuoteStorage';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, User, Phone, Mail, MapPin, Package } from 'lucide-react';

interface FinalSummaryProps {
  onNewQuote: () => void;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({ onNewQuote }) => {
  const { customerInfo, items, getTotalQuoteValue, resetQuote } = useQuoteContext();
  const { saveQuote } = useQuoteStorage();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveQuote = async () => {
    if (!customerInfo || items.length === 0) {
      toast({
        title: 'Incomplete Quote',
        description: 'Please ensure customer info and items are complete',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      await saveQuote({
        customerInfo,
        items,
        totalValue: getTotalQuoteValue()
      });
      
      setSaved(true);
      toast({
        title: 'Quote Saved Successfully',
        description: `Quote for ${customerInfo.name} has been saved to database`
      });
    } catch (error) {
      toast({
        title: 'Error Saving Quote',
        description: 'Failed to save quote. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNewQuote = () => {
    resetQuote();
    setSaved(false);
    onNewQuote();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Final Quote Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Customer Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>{customerInfo?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{customerInfo?.phone}</span>
              </div>
              {customerInfo?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{customerInfo.email}</span>
                </div>
              )}
              {customerInfo?.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{customerInfo.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Items Summary */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Items ({items.length})</span>
            </h3>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Badge variant="secondary">{formatCurrency(item.totalValue)}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>Metal: {item.metalType} {item.metalColor}</span>
                    <span>Purity: {item.purity}</span>
                    <span>Weight: {item.weight} DWT</span>
                    <span>Metal Value: {formatCurrency(item.metalValue)}</span>
                  </div>
                  {item.centerStones.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Center Stones: {item.centerStones.length}
                    </div>
                  )}
                  {item.meleeGroups.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Melee Groups: {item.meleeGroups.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              Total Quote Value: {formatCurrency(getTotalQuoteValue())}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              This quote is valid for 30 days from creation date
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            {!saved ? (
              <Button 
                onClick={handleSaveQuote} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Quote'}
              </Button>
            ) : (
              <Button 
                onClick={handleNewQuote}
                className="flex-1"
                variant="outline"
              >
                Create New Quote
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
