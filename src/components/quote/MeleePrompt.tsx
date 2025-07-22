import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteContext } from '@/contexts/QuoteContext';
import { Sparkles, X } from 'lucide-react';

interface MeleePromptProps {
  onAddMelee: () => void;
  onSkipMelee: () => void;
}

export const MeleePrompt: React.FC<MeleePromptProps> = ({ onAddMelee, onSkipMelee }) => {
  const { updateCurrentItem } = useQuoteContext();

  const handleAddMelee = () => {
    updateCurrentItem({ hasMelee: true });
    onAddMelee();
  };

  const handleSkipMelee = () => {
    updateCurrentItem({ hasMelee: false, meleeGroups: [] });
    onSkipMelee();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Melee Stone Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          <p className="text-gray-600">
            Does this item have melee stones (small accent stones) that need to be evaluated?
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleAddMelee}
              className="h-20 flex flex-col items-center gap-2"
              variant="default"
            >
              <Sparkles className="h-6 w-6" />
              <span>Add Melee</span>
            </Button>
            
            <Button 
              onClick={handleSkipMelee}
              className="h-20 flex flex-col items-center gap-2"
              variant="outline"
            >
              <X className="h-6 w-6" />
              <span>No Melee</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Melee stones are typically small diamonds or gemstones used as accent stones.
            They are usually under 0.20 carats and priced per point.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
