import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { Gem, X } from 'lucide-react';

interface CenterStonePromptProps {
  onAddStone: () => void;
  onSkipStone: () => void;
}

export const CenterStonePrompt: React.FC<CenterStonePromptProps> = ({ onAddStone, onSkipStone }) => {
  const { updateCurrentItem } = useQuoteContext();

  const handleAddStone = () => {
    updateCurrentItem({ hasCenterStone: true });
    onAddStone();
  };

  const handleSkipStone = () => {
    updateCurrentItem({ hasCenterStone: false, centerStones: [] });
    onSkipStone();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5" />
          Center Stone Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          <p className="text-gray-600">
            Does this item have a center stone that needs to be evaluated?
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleAddStone}
              className="h-20 flex flex-col items-center gap-2"
              variant="default"
            >
              <Gem className="h-6 w-6" />
              <span>Add Center Stone</span>
            </Button>
            
            <Button 
              onClick={handleSkipStone}
              className="h-20 flex flex-col items-center gap-2"
              variant="outline"
            >
              <X className="h-6 w-6" />
              <span>No Center Stone</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Center stones are typically larger, featured stones in jewelry pieces.
            If you're unsure, you can always add stones later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
