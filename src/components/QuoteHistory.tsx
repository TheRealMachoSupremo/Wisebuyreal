import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuoteStorage } from './quote/QuoteStorage';
import { useAppContext } from '@/contexts/AppContext';
import { Search, User, Phone, Calendar, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Quote {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  items: any[];
  total_value: number;
  status: string;
  created_at: string;
}

export const QuoteHistory: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { getQuotes } = useQuoteStorage();
  const { currentUser } = useAppContext();

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm]);

  const loadQuotes = async () => {
    try {
      const data = await getQuotes();
      setQuotes(data || []);
    } catch (error) {
      toast({
        title: 'Error Loading Quotes',
        description: 'Failed to load quote history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterQuotes = () => {
    if (!searchTerm) {
      setFilteredQuotes(quotes);
      return;
    }

    const filtered = quotes.filter(quote => 
      quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_phone.includes(searchTerm) ||
      (quote.customer_email && quote.customer_email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredQuotes(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading quote history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quote History</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by customer name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {quotes.length === 0 ? 'No quotes found' : 'No quotes match your search'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{quote.customer_name}</span>
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{quote.customer_phone}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(quote.created_at)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(quote.total_value)}
                        </span>
                      </div>
                      <Badge variant={quote.status === 'completed' ? 'default' : 'secondary'}>
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span>{quote.items.length} item{quote.items.length !== 1 ? 's' : ''}</span>
                    {quote.customer_email && (
                      <span className="ml-4">• {quote.customer_email}</span>
                    )}
                  </div>
                  
                  {quote.customer_address && (
                    <div className="text-sm text-gray-500 mt-1">
                      {quote.customer_address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
