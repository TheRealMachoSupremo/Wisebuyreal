import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface CenterStone {
  cut: string;
  clarity: string;
  color: string;
  shape: string;
  carat: number;
  pricePerCarat: number;
  pricingSource: string;
  percentOff: number;
  gradingLab: string;
  inscription?: string;
  value: number;
}

interface MeleeGroup {
  shape: string;
  color: string;
  clarity: string;
  count: number;
  totalCarat: number;
  pricePerPoint: number;
  value: number;
}

interface QuoteItem {
  id: string;
  photo?: string;
  description: string;
  metalType: string;
  metalColor: string;
  purity: string;
  weight: number;
  metalValue: number;
  hasCenterStone: boolean;
  centerStones: CenterStone[];
  hasMelee: boolean;
  meleeGroups: MeleeGroup[];
  totalValue: number;
}

interface QuoteContextType {
  customerInfo: CustomerInfo | null;
  currentItem: QuoteItem | null;
  items: QuoteItem[];
  currentStep: string;
  storeId?: string;
  setCustomerInfo: (info: CustomerInfo) => void;
  setCurrentItem: (item: QuoteItem | null) => void;
  addItem: (item: QuoteItem) => void;
  updateCurrentItem: (updates: Partial<QuoteItem>) => void;
  setCurrentStep: (step: string) => void;
  getTotalQuoteValue: () => number;
  resetQuote: () => void;
  setStoreId: (id: string) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const useQuoteContext = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuoteContext must be used within a QuoteProvider');
  }
  return context;
};

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentItem, setCurrentItem] = useState<QuoteItem | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [currentStep, setCurrentStep] = useState('customer-info');
  const [storeId, setStoreId] = useState<string>('');

  const addItem = (item: QuoteItem) => {
    setItems(prev => [...prev, item]);
  };

  const updateCurrentItem = (updates: Partial<QuoteItem>) => {
    setCurrentItem(prev => prev ? { ...prev, ...updates } : null);
  };

  const getTotalQuoteValue = () => {
    return items.reduce((total, item) => total + item.totalValue, 0);
  };

  const resetQuote = () => {
    setCustomerInfo(null);
    setCurrentItem(null);
    setItems([]);
    setCurrentStep('customer-info');
  };

  return (
    <QuoteContext.Provider
      value={{
        customerInfo,
        currentItem,
        items,
        currentStep,
        storeId,
        setCustomerInfo,
        setCurrentItem,
        addItem,
        updateCurrentItem,
        setCurrentStep,
        getTotalQuoteValue,
        resetQuote,
        setStoreId,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};