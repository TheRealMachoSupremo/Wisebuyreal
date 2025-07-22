import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const RapaportCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAppContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // store_id
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Callback received:', { code: code ? `${code.substring(0,6)}...` : null, state, error, errorDescription });

      if (error) {
        setStatus('error');
        const errorMsg = `Authentication failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`;
        setMessage(errorMsg);
        toast({
          title: 'Authentication Failed',
          description: errorMsg,
          variant: 'destructive'
        });
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or store ID from callback');
        toast({
          title: 'Authentication Failed',
          description: 'Missing required parameters from Rapaport',
          variant: 'destructive'
        });
        return;
      }

      try {
        console.log('Starting token exchange...');
        setMessage('Exchanging authorization code for access token...');

        // Log the callback attempt
        try {
          await supabase.from('rapaport_auth_log').insert({
            store_id: state,
            event_type: 'callback_received',
            status: 'initiated',
            code_fragment: code.substring(code.length - 6),
            timestamp: new Date().toISOString()
          });
        } catch (logError) {
          console.warn('Failed to log callback attempt:', logError);
        }

        // Exchange code for tokens using the updated edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('rapaport-oauth-exchange', {
          body: {
            code: code,
            state: state
          }
        });

        console.log('Token exchange response:', { data, exchangeError });
        setDebugInfo({ data, exchangeError, code_fragment: code.substring(0, 6) });

        if (exchangeError) {
          throw new Error(`Function invocation failed: ${exchangeError.message}`);
        }

        if (!data?.success) {
          const errorMsg = data?.error_message || data?.error || 'Token exchange failed';
          
          // Determine if retry is possible based on error type
          const shouldRetry = !errorMsg.includes('invalid_client') && !errorMsg.includes('invalid_grant');
          setCanRetry(shouldRetry);
          
          let userFriendlyMessage = 'Authentication failed';
          if (errorMsg.includes('invalid_client')) {
            userFriendlyMessage += ': Invalid client credentials';
          } else if (errorMsg.includes('invalid_grant') || errorMsg.includes('expired')) {
            userFriendlyMessage += ': Authorization code expired';
          } else if (errorMsg.includes('redirect_uri')) {
            userFriendlyMessage += ': Redirect URI mismatch';
          } else {
            userFriendlyMessage += `: ${errorMsg}`;
          }
          
          setMessage(userFriendlyMessage);
          throw new Error(userFriendlyMessage);
        }

        setStatus('success');
        setMessage('Successfully connected to Rapaport! Your account is now linked.');
        toast({
          title: 'Success',
          description: 'Rapaport account connected successfully',
          variant: 'default'
        });

        // Log successful authentication
        try {
          await supabase.from('rapaport_auth_log').insert({
            store_id: state,
            event_type: 'auth_success',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
        } catch (logError) {
          console.warn('Failed to log auth success:', logError);
        }

        // Close the popup window if this is in a popup
        if (window.opener) {
          window.close();
        } else {
          // Redirect to admin panel after 2 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }

      } catch (error) {
        console.error('Token exchange error:', error);
        setStatus('error');
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Log failed authentication
        try {
          await supabase.from('rapaport_auth_log').insert({
            store_id: state,
            event_type: 'auth_failed',
            status: 'failed',
            error_message: errorMessage,
            timestamp: new Date().toISOString()
          });
        } catch (logError) {
          console.warn('Failed to log auth failure:', logError);
        }
        
        toast({
          title: 'Authentication Failed',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const handleRetryLogin = () => {
    const state = searchParams.get('state');
    if (state) {
      const authUrl = `https://rapaport.auth0.com/authorize?response_type=code&client_id=xxwYxFoXN0Z8HI66lJqjfDTcR2S1GLW6&redirect_uri=https://app.wisebuyusa.com/rapaport/callback&audience=https://apigateway.rapnetapis.com&scope=manageListings%20priceListWeekly%20instantInventory%20offline_access&state=${state}`;
      console.log('Retrying with URL:', authUrl);
      window.location.href = authUrl;
    }
  };

  const handleReturnToApp = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/', { replace: true });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Connecting to Rapaport...';
      case 'success':
        return 'Connection Successful!';
      case 'error':
        return 'Connection Failed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{getStatusTitle()}</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we connect your Rapaport account...'}
            {status === 'success' && 'Your Rapaport account has been successfully connected.'}
            {status === 'error' && 'There was an issue connecting your Rapaport account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          {status === 'error' && (
            <div className="space-y-2">
              {canRetry && (
                <Button onClick={handleRetryLogin} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Login
                </Button>
              )}
              <Button onClick={handleReturnToApp} variant="outline" className="w-full">
                Return to App
              </Button>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {window.opener ? 'This window will close automatically.' : 'Returning to app...'}
              </p>
              <Button onClick={handleReturnToApp} variant="outline" className="w-full">
                Return to App Now
              </Button>
            </div>
          )}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">Debug Information</summary>
              <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40 p-2 bg-gray-50 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RapaportCallback;