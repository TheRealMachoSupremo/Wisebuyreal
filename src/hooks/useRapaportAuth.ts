import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface RapaportToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export const useRapaportAuth = (storeId?: string) => {
  const [token, setToken] = useState<RapaportToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchToken = async () => {
    if (!storeId) return;
    
    try {
      const { data, error } = await supabase
        .from('rapaport_auth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('store_id', storeId)
        .single();
      
      if (error || !data) {
        setToken(null);
        return;
      }
      
      setToken(data);
    } catch (error) {
      console.error('Error fetching token:', error);
      setToken(null);
    }
  };

  const refreshToken = async () => {
    if (!storeId || !token?.refresh_token) return false;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-rapaport-token', {
        body: { store_id: storeId }
      });
      
      if (error || !data?.success) {
        toast({
          title: 'Token Refresh Failed',
          description: 'Please reconnect your Rapaport account',
          variant: 'destructive'
        });
        return false;
      }
      
      await fetchToken();
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    if (!token) return null;
    
    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    
    if (expiresAt > now) {
      return token.access_token;
    }
    
    const refreshed = await refreshToken();
    return refreshed ? token.access_token : null;
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const accessToken = await getValidToken();
    if (!accessToken) {
      throw new Error('No valid access token available');
    }
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  };

  useEffect(() => {
    fetchToken();
  }, [storeId]);

  return {
    token,
    isLoading,
    refreshToken,
    getValidToken,
    makeAuthenticatedRequest,
    refetch: fetchToken
  };
};

export default useRapaportAuth;