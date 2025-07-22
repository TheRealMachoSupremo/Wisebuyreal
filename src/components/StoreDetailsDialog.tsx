import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import StorePricingDisplay from './StorePricingDisplay';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Store {
  id: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_website?: string;
  admin_name: string;
  admin_email: string;
  admin_password?: string;
  gold_markup: number;
  silver_markup: number;
  platinum_markup: number;
  status: string;
  created_at: string;
  pricing_basis?: string;
  discount?: number;
}

interface StoreDetailsDialogProps {
  store: Store | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoreDetailsDialog: React.FC<StoreDetailsDialogProps> = ({ store, open, onOpenChange }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [storeData, setStoreData] = useState<Store | null>(null);
  
  useEffect(() => {
    if (store && open) {
      fetchStoreDetails();
    }
  }, [store, open]);

  const fetchStoreDetails = async () => {
    if (!store) return;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', store.id)
        .single();
      
      if (error) throw error;
      setStoreData(data);
    } catch (error) {
      console.error('Error fetching store details:', error);
      setStoreData(store);
    }
  };
  
  if (!store) return null;

  const currentStore = storeData || store;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to clipboard",
    });
  };

  const updateStoreStatus = async (storeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      if (error) throw error;
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating store status:', error);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);
      
      if (error) throw error;
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const mockPricingMethods = [
    { name: 'YEOB', value: 1847.50, change: 2.3, period: 'Year End' },
    { name: '90 Day', value: 1832.75, change: -0.8, period: '90 Days' },
    { name: '180 Day', value: 1856.20, change: 1.2, period: '180 Days' }
  ];
  
  const storeDiscount = currentStore.discount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {currentStore.store_name}
            <Badge variant={currentStore.status === 'active' ? 'default' : currentStore.status === 'pending' ? 'secondary' : 'destructive'}>
              {currentStore.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">Store ID</h3>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                {currentStore.id}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentStore.id)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Store Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Address:</strong> {currentStore.store_address}</p>
                <p><strong>Phone:</strong> {currentStore.store_phone}</p>
                {currentStore.store_website && <p><strong>Website:</strong> {currentStore.store_website}</p>}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Admin Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {currentStore.admin_name}</p>
                <p><strong>Email:</strong> {currentStore.admin_email}</p>
                {currentStore.admin_password && (
                  <div className="flex items-center space-x-2">
                    <span><strong>Password:</strong></span>
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                      {showPassword ? currentStore.admin_password : '••••••••'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentStore.admin_password!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <StorePricingDisplay
              storeId={currentStore.id}
              storeName={currentStore.store_name}
              pricingMethods={mockPricingMethods}
              saveDiscount={storeDiscount}
            />
          </div>
          
          <div className="flex space-x-2 pt-4">
            {currentStore.status === 'pending' && (
              <>
                <Button onClick={() => updateStoreStatus(currentStore.id, 'active')} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Store
                </Button>
                <Button onClick={() => updateStoreStatus(currentStore.id, 'rejected')} variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Store
                </Button>
              </>
            )}
            <Button onClick={() => deleteStore(currentStore.id)} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreDetailsDialog;