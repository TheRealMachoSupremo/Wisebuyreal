import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useStoreDiamondPricing } from './useStoreDiamondPricing';

interface DiamondPriceEntry {
  id: string;
  shape: string;
  shape_type: string;
  color: string;
  clarity: string;
  carat_min: number;
  carat_max: number;
  price_per_carat: number;
}

interface DiamondSpecs {
  shape: string;
  color: string;
  clarity: string;
  carat: number;
}

interface PricingResult {
  pricePerCarat: number | null;
  source: 'dev_csv' | 'rapaport' | 'manual' | 'not_found';
  error?: string;
  requiresAuth?: boolean;
  isExpired?: boolean;
}

export const useDiamondPricing = () => {
  const { currentStore } = useAppContext();
  const { getStoreDiamondPrice, isPriceListExpired } = useStoreDiamondPricing();
  const [useDevPricing, setUseDevPricing] = useState(false);
  const [pricingData, setPricingData] = useState<DiamondPriceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevPricingSetting();
    loadPricingData();
  }, []);

  const loadDevPricingSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'use_dev_diamond_pricing')
        .single();
      
      if (error) {
        console.log('No dev pricing setting found, defaulting to false');
        setUseDevPricing(false);
        return;
      }
      setUseDevPricing(data.setting_value);
    } catch (error) {
      console.error('Error loading dev pricing setting:', error);
      setUseDevPricing(false);
    }
  };

  const loadPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('diamond_pricing_lists')
        .select('*');
      
      if (error) throw error;
      console.log('Loaded pricing data:', data?.length, 'entries');
      setPricingData(data || []);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      setPricingData([]);
    } finally {
      setLoading(false);
    }
  };

  const getDiamondPrice = async (specs: DiamondSpecs): Promise<PricingResult> => {
    console.log('Getting diamond price for:', specs, 'useDevPricing:', useDevPricing);
    
    // Step 1: IF use_dev_diamond_pricing = true → Always use local CSVs
    if (useDevPricing) {
      return getDevPrice(specs);
    }

    // Step 2: ELSE IF store has a saved Rapaport price list AND it's less than 30 days old → Use Rapaport data
    if (currentStore?.id) {
      const listType = specs.shape.toLowerCase() === 'round' ? 'round' : 'fancy';
      const isExpired = isPriceListExpired(listType, 30);
      
      if (!isExpired) {
        const storePrice = getStoreDiamondPrice(specs);
        if (storePrice) {
          return {
            pricePerCarat: storePrice,
            source: 'rapaport'
          };
        }
      } else {
        // Price list exists but is expired
        return {
          pricePerCarat: null,
          source: 'manual',
          isExpired: true,
          error: 'Your diamond pricing may be outdated — consider refreshing from Rapaport.'
        };
      }
    }

    // Step 3: ELSE → Prompt user to either log into Rapaport or enter price manually
    return {
      pricePerCarat: null,
      source: 'manual',
      requiresAuth: true,
      error: 'No pricing data available. Please log into Rapaport to sync or enter price manually.'
    };
  };

  const getDevPrice = (specs: DiamondSpecs): PricingResult => {
    console.log('Searching dev pricing data for:', specs);
    console.log('Available data entries:', pricingData.length);
    
    // Determine which CSV to use based on shape
    const isRound = specs.shape.toLowerCase() === 'round';
    const targetShapeCode = isRound ? 'BR' : getShapeCode(specs.shape);
    
    console.log('Target shape code:', targetShapeCode, 'isRound:', isRound);
    
    // Find matching entry with strict carat range logic
    const match = pricingData.find(entry => {
      const shapeMatch = entry.shape === targetShapeCode;
      const colorMatch = entry.color === specs.color;
      const clarityMatch = entry.clarity === specs.clarity;
      // Strict range: carat_weight > carat_min && carat_weight <= carat_max
      const caratMatch = specs.carat > entry.carat_min && specs.carat <= entry.carat_max;
      
      console.log('Checking entry:', {
        entryShape: entry.shape,
        targetShape: targetShapeCode,
        shapeMatch,
        colorMatch,
        clarityMatch,
        caratMatch,
        caratWeight: specs.carat,
        caratMin: entry.carat_min,
        caratMax: entry.carat_max,
        pricePerCarat: entry.price_per_carat
      });
      
      return shapeMatch && colorMatch && clarityMatch && caratMatch;
    });

    if (match) {
      console.log('Found matching price:', match.price_per_carat);
      return {
        pricePerCarat: match.price_per_carat,
        source: 'dev_csv'
      };
    }

    console.log('No matching price found');
    return {
      pricePerCarat: null,
      source: 'not_found',
      error: `No pricing data available for ${specs.shape} ${specs.color} ${specs.clarity} ${specs.carat}ct`
    };
  };

  const getShapeCode = (shape: string): string => {
    const shapeMap: { [key: string]: string } = {
      'round': 'BR',
      'princess': 'PR',
      'emerald': 'EM',
      'asscher': 'AS',
      'oval': 'OV',
      'radiant': 'RA',
      'cushion': 'CU',
      'pear': 'PE',
      'heart': 'HE',
      'marquise': 'MQ'
    };
    return shapeMap[shape.toLowerCase()] || shape.toUpperCase();
  };

  const calculateCenterStoneValue = (carat: number, pricePerCarat: number, discountPercent: number = 0): number => {
    return carat * pricePerCarat * (1 - discountPercent / 100);
  };

  return {
    useDevPricing,
    loading,
    getDiamondPrice,
    calculateCenterStoneValue,
    refreshData: () => {
      loadDevPricingSetting();
      loadPricingData();
    }
  };
};

export default useDiamondPricing;