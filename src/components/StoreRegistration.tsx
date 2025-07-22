import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface StoreRegistrationProps {
  onBack?: () => void;
}

const StoreRegistration: React.FC<StoreRegistrationProps> = ({ onBack }) => {
  const { registerStore } = useAppContext();
  const [formData, setFormData] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeWebsite: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    goldMarkup: '',
    silverMarkup: '',
    platinumMarkup: '',
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!formData.termsAccepted) {
      alert('Please accept the terms of use');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('stores').insert({
        store_name: formData.storeName,
        store_address: formData.storeAddress,
        store_phone: formData.storePhone,
        store_website: formData.storeWebsite || null,
        admin_name: formData.adminName,
        admin_email: formData.adminEmail,
        admin_password: formData.adminPassword,
        gold_markup: formData.goldMarkup ? parseFloat(formData.goldMarkup) : 20,
        silver_markup: formData.silverMarkup ? parseFloat(formData.silverMarkup) : 15,
        platinum_markup: formData.platinumMarkup ? parseFloat(formData.platinumMarkup) : 25
      }).select();

      if (error) throw error;
      
      const storeId = data[0]?.id;
      
      // Also register in context for local state
      registerStore({
        id: storeId,
        storeName: formData.storeName,
        storeAddress: formData.storeAddress,
        storePhone: formData.storePhone,
        storeWebsite: formData.storeWebsite,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        metalMarkup: {
          gold: formData.goldMarkup ? parseFloat(formData.goldMarkup) : 20,
          silver: formData.silverMarkup ? parseFloat(formData.silverMarkup) : 15,
          platinum: formData.platinumMarkup ? parseFloat(formData.platinumMarkup) : 25
        }
      });
      
      alert(`Store registration submitted successfully! Store ID: ${storeId}`);
      if (onBack) onBack();
    } catch (error) {
      console.error('Error registering store:', error);
      alert('Error registering store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Store Registration
          </CardTitle>
          <CardDescription className="text-lg">
            Join our jewelry quote calculator platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="storePhone">Store Phone *</Label>
                <Input
                  id="storePhone"
                  value={formData.storePhone}
                  onChange={(e) => handleChange('storePhone', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="storeAddress">Store Address *</Label>
              <Input
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) => handleChange('storeAddress', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="storeWebsite">Store Website (Optional)</Label>
              <Input
                id="storeWebsite"
                value={formData.storeWebsite}
                onChange={(e) => handleChange('storeWebsite', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminName">Admin Full Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => handleChange('adminPassword', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goldMarkup">Gold Markup % (default: 20)</Label>
                <Input
                  id="goldMarkup"
                  type="number"
                  value={formData.goldMarkup}
                  onChange={(e) => handleChange('goldMarkup', e.target.value)}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="silverMarkup">Silver Markup % (default: 15)</Label>
                <Input
                  id="silverMarkup"
                  type="number"
                  value={formData.silverMarkup}
                  onChange={(e) => handleChange('silverMarkup', e.target.value)}
                  placeholder="15"
                />
              </div>
              <div>
                <Label htmlFor="platinumMarkup">Platinum Markup % (default: 25)</Label>
                <Input
                  id="platinumMarkup"
                  type="number"
                  value={formData.platinumMarkup}
                  onChange={(e) => handleChange('platinumMarkup', e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => handleChange('termsAccepted', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I accept the Terms of Use and Privacy Policy
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Store'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreRegistration;