import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import OAuthConfigEditor from './OAuthConfigEditor';
import RapaportAuthLogger from './RapaportAuthLogger';

interface AuthToken {
  store_id: string;
  expires_at: string;
  updated_at: string;
}

const ThirdPartyAuthTab: React.FC = () => {
  const { currentUser } = useAppContext();
  const [authTokens, setAuthTokens] = useState<AuthToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('xxwYxFoXN0Z8HI66lJqjfDTcR2S1GLW6');
  const [redirectUri, setRedirectUri] = useState('https://app.wisebuyusa.com/rapaport/callback');
  const [testingAuth, setTestingAuth] = useState(false);

  const handleConfigSave = (newClientId: string, newRedirectUri: string) => {
    setClientId(newClientId);
    setRedirectUri(newRedirectUri);
  };

  const fetchAuthData = async () => {
    setLoading(true);
    try {
      const { data: tokensData, error: tokensError } = await supabase
        .from('rapaport_auth_tokens')
        .select('store_id, expires_at, updated_at');

      if (tokensError) throw tokensError;
      setAuthTokens(tokensData || []);
    } catch (error) {
      console.error('Error fetching auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testTokenExchange = async () => {
    if (!currentUser) {
      console.error('No current user - cannot run diagnostic test');
      return;
    }

    setTestingAuth(true);
    try {
      console.log('Testing token exchange with diagnostic payload...');
      
      // Test with a dummy code to see the response format
      const { data, error } = await supabase.functions.invoke('rapaport-oauth-exchange', {
        body: {
          code: 'test_diagnostic_code_123456',
          store_id: currentUser.storeId || 'diagnostic_test'
        }
      });

      console.log('Diagnostic test response:', { data, error });
      
      // Log the test attempt without logging out the user
      try {
        await supabase.from('rapaport_auth_log').insert({
          store_id: currentUser.storeId || 'diagnostic_test',
          event_type: 'diagnostic_test',
          status: data?.success ? 'success' : 'failure',
          error_message: data?.error || error?.message || 'Diagnostic test completed',
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging diagnostic test:', logError);
      }
      
    } catch (error) {
      console.error('Test token exchange error:', error);
    } finally {
      setTestingAuth(false);
      // Refresh data without full page reload to prevent logout
      await fetchAuthData();
    }
  };

  useEffect(() => {
    fetchAuthData();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTokenStatus = (token: AuthToken) => {
    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    return expiresAt > now ? 'active' : 'expired';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading authentication data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Enhanced Diagnostics Active:</strong> Using credentials Client ID: {clientId.substring(0, 8)}... 
          All token exchange attempts are logged with full request/response details for debugging.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OAuth Configuration & Diagnostics</CardTitle>
              <CardDescription>Rapaport OAuth settings with diagnostic tools</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={testTokenExchange} 
                variant="outline" 
                size="sm"
                disabled={testingAuth || !currentUser}
              >
                {testingAuth ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Run Diagnostic Test
              </Button>
              <OAuthConfigEditor
                clientId={clientId}
                redirectUri={redirectUri}
                onSave={handleConfigSave}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Client ID (Current)
              </h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                  {clientId}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(clientId)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Redirect URI (Current)
              </h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                  {redirectUri}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(redirectUri)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Authentication Status</CardTitle>
          <CardDescription>Overview of all store Rapaport connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {authTokens.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No stores have connected to Rapaport yet.</p>
            ) : (
              authTokens.map((token) => {
                const status = getTokenStatus(token);
                const expiresAt = new Date(token.expires_at);
                return (
                  <div key={token.store_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Store {token.store_id}</h4>
                      <p className="text-xs text-gray-500">
                        Expires: {expiresAt.toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <RapaportAuthLogger />
    </div>
  );
};

export default ThirdPartyAuthTab;