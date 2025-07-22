import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { Plus, ArrowRight } from 'lucide-react';

interface AddStonePromptProps {
  onAddAnother: () => void;
  onContinue: () => void;
}

export const AddStonePrompt: React.FC<AddStonePromptProps> = ({ onAddAnother, onContinue }) => {
  const { currentItem } = useQuoteContext();
  const stoneCount = currentItem?.centerStones?.length || 0;
  const totalStoneValue = currentItem?.centerStones?.reduce((sum, stone) => sum + stone.value, 0) || 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Center Stones Added</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You have added {stoneCount} center stone{stoneCount !== 1 ? 's' : ''}
            </p>
            <p className="text-lg font-semibold">
              Total Center Stone Value: ${totalStoneValue.toFixed(2)}
            </p>
          </div>
          
          {currentItem?.centerStones && currentItem.centerStones.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Added Stones:</h4>
              {currentItem.centerStones.map((stone, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded flex justify-between">
                  <span>
                    {stone.carat}ct {stone.color} {stone.clarity} {stone.shape}
                  </span>
                  <span className="font-medium">${stone.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onAddAnother}
              className="h-16 flex flex-col items-center gap-2"
              variant="outline"
            >
              <Plus className="h-5 w-5" />
              <span>Add Another Stone</span>
            </Button>
            
            <Button 
              onClick={onContinue}
              className="h-16 flex flex-col items-center gap-2"
              variant="default"
            >
              <ArrowRight className="h-5 w-5" />
              <span>Continue to Melee</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
