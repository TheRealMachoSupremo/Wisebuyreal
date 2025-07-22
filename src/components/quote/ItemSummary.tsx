import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { toast } from '@/components/ui/use-toast';
import { Edit, Plus, CheckCircle } from 'lucide-react';

interface ItemSummaryProps {
  onEditMetal: () => void;
  onEditCenterStones: () => void;
  onEditMelee: () => void;
  onAddItem: () => void;
}

export const ItemSummary: React.FC<ItemSummaryProps> = ({
  onEditMetal,
  onEditCenterStones,
  onEditMelee,
  onAddItem,
}) => {
  const { currentItem, addItem, setCurrentItem } = useQuoteContext();

  if (!currentItem) return null;

  const handleAddItem = () => {
    addItem(currentItem);
    
    // Reset current item
    setCurrentItem(null);
    
    toast({
      title: 'Item Added to Quote',
      description: `Total value: $${currentItem.totalValue.toFixed(2)}`,
    });
    
    onAddItem();
  };

  const metalValue = currentItem.metalValue || 0;
  const centerStonesValue = currentItem.centerStones?.reduce((sum, stone) => sum + stone.value, 0) || 0;
  const meleeValue = currentItem.meleeGroups?.reduce((sum, group) => sum + group.value, 0) || 0;
  const totalValue = currentItem.totalValue || 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Item Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Item Photo and Description */}
        <div className="space-y-2">
          {currentItem.photo && (
            <img src={currentItem.photo} alt="Item" className="w-full h-32 object-cover rounded" />
          )}
          <p className="font-medium">{currentItem.description}</p>
        </div>

        {/* Metal Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Metal Value</h3>
            <Button onClick={onEditMetal} variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="pl-4 space-y-1">
            <p className="text-sm text-gray-600">
              {currentItem.metalType} - {currentItem.metalColor} - {currentItem.purity}
            </p>
            <p className="text-sm text-gray-600">
              Weight: {currentItem.weight} DWT
            </p>
            <p className="font-medium">${metalValue.toFixed(2)}</p>
          </div>
        </div>

        <Separator />

        {/* Center Stones Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Center Stones</h3>
            <Button onClick={onEditCenterStones} variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="pl-4">
            {currentItem.centerStones && currentItem.centerStones.length > 0 ? (
              <div className="space-y-2">
                {currentItem.centerStones.map((stone, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {stone.carat}ct {stone.color} {stone.clarity} {stone.shape}
                    </span>
                    <span>${stone.value.toFixed(2)}</span>
                  </div>
                ))}
                <p className="font-medium pt-1 border-t">
                  Total: ${centerStonesValue.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No center stones</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Melee Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Melee Stones</h3>
            <Button onClick={onEditMelee} variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="pl-4">
            {currentItem.meleeGroups && currentItem.meleeGroups.length > 0 ? (
              <div className="space-y-2">
                {currentItem.meleeGroups.map((group, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {group.count} × {group.shape} {group.color} {group.clarity}
                    </span>
                    <span>${group.value.toFixed(2)}</span>
                  </div>
                ))}
                <p className="font-medium pt-1 border-t">
                  Total: ${meleeValue.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No melee stones</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Total Value */}
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Item Value:</span>
            <span className="text-lg font-bold">${totalValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button onClick={handleAddItem} className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Item to Quote
        </Button>
      </CardContent>
    </Card>
  );
};
