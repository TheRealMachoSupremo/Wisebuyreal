import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface QuoteData {
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  items: any[];
  totalValue: number;
}

export const useQuoteStorage = () => {
  const { currentUser } = useAppContext();

  const saveQuote = async (quoteData: QuoteData) => {
    if (!currentUser?.storeId) {
      throw new Error('No store ID available');
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          store_id: currentUser.storeId,
          customer_name: quoteData.customerInfo.name,
          customer_phone: quoteData.customerInfo.phone,
          customer_email: quoteData.customerInfo.email,
          customer_address: quoteData.customerInfo.address,
          items: quoteData.items,
          total_value: quoteData.totalValue,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  };

  const getQuotes = async () => {
    if (!currentUser?.storeId) {
      throw new Error('No store ID available');
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('store_id', currentUser.storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  };

  return { saveQuote, getQuotes };
};
