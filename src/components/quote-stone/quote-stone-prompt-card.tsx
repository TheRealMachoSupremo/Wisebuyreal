import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, ArrowRight } from 'lucide-react';

interface QuoteStonePromptCardProps {
  onAddStone: () => void;
  onSkipStone: () => void;
}

export const QuoteStonePromptCard: React.FC<QuoteStonePromptCardProps> = ({ onAddStone, onSkipStone }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gem className="w-5 h-5 mr-2" />
          Center Stone Evaluation
        </CardTitle>
        <p className="text-sm text-muted-foreground">Step 3 of 9</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg mb-4">Does this item have a center stone that needs to be evaluated?</p>
          <p className="text-sm text-gray-600 mb-6">
            Center stones are typically the main gemstone in rings, pendants, or earrings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={onAddStone}
            className="h-16 flex flex-col items-center justify-center space-y-2"
            data-testid="add-stone-button"
          >
            <Gem className="w-6 h-6" />
            <span>Yes, Add Center Stone</span>
          </Button>
          
          <Button 
            onClick={onSkipStone}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-2"
            data-testid="skip-stone-button"
          >
            <ArrowRight className="w-6 h-6" />
            <span>No, Skip to Melee</span>
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>You can always add more stones later in the process.</p>
        </div>
      </CardContent>
    </Card>
  );
};