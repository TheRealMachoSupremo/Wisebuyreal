import React, { useState, useEffect } from 'react';
import { QuoteProvider, useQuoteContext } from '@/contexts/QuoteContext';
import { QuoteStartCustomerCard } from './quote-start/quote-start-customer-card';
import { QuoteItemDetailsCard } from './quote-item/quote-item-details-card';
import { QuoteStonePromptCard } from './quote-stone/quote-stone-prompt-card';
import { StoneDetailsForm } from './quote/StoneDetailsForm';
import { AddStonePrompt } from './quote/AddStonePrompt';
import { MeleePrompt } from './quote/MeleePrompt';
import { MeleeDetailsForm } from './quote/MeleeDetailsForm';
import { ItemSummary } from './quote/ItemSummary';
import { FinalSummary } from './quote/FinalSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type Step = 'customer-info' | 'item-details' | 'center-stone-prompt' | 'stone-details' | 'add-stone-prompt' | 'melee-prompt' | 'melee-details' | 'item-summary' | 'final-summary';

const stepTitles: Record<Step, string> = {
  'customer-info': 'Customer Information',
  'item-details': 'Item Details',
  'center-stone-prompt': 'Center Stone Evaluation',
  'stone-details': 'Stone Details',
  'add-stone-prompt': 'Add More Stones',
  'melee-prompt': 'Melee Evaluation',
  'melee-details': 'Melee Details',
  'item-summary': 'Item Summary',
  'final-summary': 'Final Quote'
};

const getStepProgress = (step: Step): number => {
  const steps: Step[] = ['customer-info', 'item-details', 'center-stone-prompt', 'stone-details', 'add-stone-prompt', 'melee-prompt', 'melee-details', 'item-summary', 'final-summary'];
  return ((steps.indexOf(step) + 1) / steps.length) * 100;
};

const QuoteFlowContent: React.FC = () => {
  const { currentStep, setCurrentStep, resetQuote } = useQuoteContext();
  const [localStep, setLocalStep] = useState<Step>('customer-info');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('QuoteFlowContent mounted, resetting quote');
    resetQuote();
    setLocalStep('customer-info');
    setCurrentStep('customer-info');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && currentStep && currentStep !== localStep) {
      console.log('Syncing step from context:', currentStep, 'to local:', localStep);
      setLocalStep(currentStep as Step);
    }
  }, [currentStep, localStep, isInitialized]);

  const navigateToStep = (step: Step) => {
    console.log('Navigating to step:', step);
    setLocalStep(step);
    setCurrentStep(step);
  };

  const renderStep = () => {
    console.log('Rendering step:', localStep);
    switch (localStep) {
      case 'customer-info':
        return <QuoteStartCustomerCard onNext={() => navigateToStep('item-details')} />;
      case 'item-details':
        return <QuoteItemDetailsCard onNext={() => navigateToStep('center-stone-prompt')} />;
      case 'center-stone-prompt':
        return (
          <QuoteStonePromptCard 
            onAddStone={() => navigateToStep('stone-details')}
            onSkipStone={() => navigateToStep('melee-prompt')}
          />
        );
      case 'stone-details':
        return <StoneDetailsForm onNext={() => navigateToStep('add-stone-prompt')} />;
      case 'add-stone-prompt':
        return (
          <AddStonePrompt 
            onAddAnother={() => navigateToStep('stone-details')}
            onContinue={() => navigateToStep('melee-prompt')}
          />
        );
      case 'melee-prompt':
        return (
          <MeleePrompt 
            onAddMelee={() => navigateToStep('melee-details')}
            onSkipMelee={() => navigateToStep('item-summary')}
          />
        );
      case 'melee-details':
        return <MeleeDetailsForm onNext={() => navigateToStep('item-summary')} />;
      case 'item-summary':
        return (
          <ItemSummary 
            onEditMetal={() => navigateToStep('item-details')}
            onEditCenterStones={() => navigateToStep('center-stone-prompt')}
            onEditMelee={() => navigateToStep('melee-prompt')}
            onAddItem={() => navigateToStep('final-summary')}
          />
        );
      case 'final-summary':
        return <FinalSummary onNewQuote={() => navigateToStep('customer-info')} />;
      default:
        return <QuoteStartCustomerCard onNext={() => navigateToStep('item-details')} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Initializing quote flow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quote Creation - {stepTitles[localStep]}</CardTitle>
          <Progress value={getStepProgress(localStep)} className="w-full" />
        </CardHeader>
      </Card>
      {renderStep()}
    </div>
  );
};

export const QuoteFlow: React.FC = () => {
  return (
    <QuoteProvider>
      <QuoteFlowContent />
    </QuoteProvider>
  );
};