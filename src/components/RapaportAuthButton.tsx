import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import OAuthConfigEditor from './OAuthConfigEditor';

interface RapaportAuthButtonProps {
  onAuthSuccess?: () => void;
}

const RapaportAuthButton: React.FC<RapaportAuthButtonProps> = ({ onAuthSuccess }) => {
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'authenticated' | 'expired'>('none');
  const [clientId, setClientId] = useState('xxwYxFoXN0Z8HI66lJqjfDTcR2S1GLW6');
  const [redirectUri, setRedirectUri] = useState('https://app.wisebuyusa.com/rapaport/callback');

  const generateAuthUrl = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'manageListings priceListWeekly instantInventory offline_access',
      audience: 'https://apigateway.rapnetapis.com',
      state: currentUser?.storeId || ''
    });
    return `https://rapaport.auth0.com/authorize?${params.toString()}`;
  };

  const handleConfigSave = (newClientId: string, newRedirectUri: string) => {
    setClientId(newClientId);
    setRedirectUri(newRedirectUri);
  };

  const handleAuthClick = async () => {
    if (!currentUser?.storeId) {
      toast({
        title: 'Error',
        description: 'No store selected. Please select a store first.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    // Log the auth attempt start
    try {
      await supabase.from('rapaport_auth_log').insert({
        store_id: currentUser.storeId,
        event_type: 'auth_start',
        status: 'initiated',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log auth start:', error);
    }

    const authUrl = generateAuthUrl();
    console.log('Opening auth URL:', authUrl);
    
    const popup = window.open(authUrl, 'rapaport-auth', 'width=600,height=700');
    
    // Monitor popup for completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        // Refresh auth status after popup closes
        setTimeout(() => checkAuthStatus(), 1000);
      }
    }, 1000);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup?.closed) {
        popup?.close();
        clearInterval(checkClosed);
        setIsLoading(false);
      }
    }, 300000);
  };

  const checkAuthStatus = async () => {
    if (!currentUser?.storeId) return;
    try {
      const { data, error } = await supabase
        .from('rapaport_auth_tokens')
        .select('expires_at')
        .eq('store_id', currentUser.storeId)
        .single();
      if (error || !data) {
        setAuthStatus('none');
        return;
      }
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (expiresAt > now) {
        setAuthStatus('authenticated');
        onAuthSuccess?.();
      } else {
        setAuthStatus('expired');
      }
    } catch (error) {
      setAuthStatus('none');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [currentUser?.storeId]);

  const getStatusDisplay = () => {
    switch (authStatus) {
      case 'authenticated':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Not Connected
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        {getStatusDisplay()}
        <Button
          onClick={handleAuthClick}
          disabled={isLoading}
          variant={authStatus === 'authenticated' ? 'outline' : 'default'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Key className="w-4 h-4 mr-2" />
          )}
          {authStatus === 'authenticated' ? 'Reconnect' : 'Connect'} Rapaport
        </Button>
        <OAuthConfigEditor
          clientId={clientId}
          redirectUri={redirectUri}
          onSave={handleConfigSave}
        />
      </div>
      <div className="text-xs text-gray-500">
        Client ID: {clientId} | Redirect: {redirectUri}
      </div>
    </div>
  );
};

export default RapaportAuthButton;