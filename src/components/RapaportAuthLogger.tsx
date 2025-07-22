import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';

interface AuthLog {
  id: string;
  store_id: string;
  event_type: string;
  status: 'success' | 'failure' | 'initiated';
  error_message?: string;
  code_fragment?: string;
  timestamp: string;
  created_at: string;
}

const RapaportAuthLogger: React.FC = () => {
  const { currentUser } = useAppContext();
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rapaport_auth_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error fetching auth logs:', error);
        return;
      }
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching auth logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLogs();
    }
  }, [currentUser]);

  const toggleDetails = (logId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'initiated':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'auth_start':
        return 'Auth Started';
      case 'login_attempt':
        return 'Login Attempt';
      case 'token_exchange':
        return 'Token Exchange';
      case 'token_refresh':
        return 'Token Refresh';
      case 'diagnostic_test':
        return 'Diagnostic Test';
      default:
        return eventType;
    }
  };

  const getErrorCategory = (errorMessage?: string) => {
    if (!errorMessage) return null;
    
    if (errorMessage.includes('invalid_client') || errorMessage.includes('Invalid client ID')) {
      return 'Invalid Credentials';
    }
    if (errorMessage.includes('expired') || errorMessage.includes('invalid_grant')) {
      return 'Code Expired';
    }
    if (errorMessage.includes('redirect') || errorMessage.includes('Callback URL')) {
      return 'Redirect URI Issue';
    }
    if (errorMessage.includes('improperly formatted') || errorMessage.includes('Missing')) {
      return 'Request Format Error';
    }
    if (errorMessage.includes('invalid JSON') || errorMessage.includes('HTML')) {
      return 'API Response Error';
    }
    if (errorMessage.includes('Unexpected response')) {
      return 'Incomplete Response';
    }
    if (errorMessage.includes('Diagnostic test completed')) {
      return 'Test Completed';
    }
    return 'Other Error';
  };

  const getErrorSolution = (errorMessage?: string) => {
    if (!errorMessage) return null;
    
    if (errorMessage.includes('invalid_client') || errorMessage.includes('Invalid client ID')) {
      return 'Check that Client ID (xxwYxFoXN0Z8HI66lJqjfDTcR2S1GLW6) and Client Secret are correct.';
    }
    if (errorMessage.includes('expired') || errorMessage.includes('invalid_grant')) {
      return 'Authorization code has expired. User should retry the login process.';
    }
    if (errorMessage.includes('redirect') || errorMessage.includes('Callback URL')) {
      return 'Ensure https://app.wisebuyusa.com/rapaport/callback is registered with Rapaport.';
    }
    if (errorMessage.includes('improperly formatted')) {
      return 'Check that all required fields (client_id, client_secret, code, redirect_uri) are present.';
    }
    if (errorMessage.includes('invalid JSON') || errorMessage.includes('HTML')) {
      return 'Rapaport API returned HTML instead of JSON. Check API endpoint and network connectivity.';
    }
    if (errorMessage.includes('Diagnostic test completed')) {
      return 'Diagnostic test ran successfully. Check response details for API behavior.';
    }
    return 'Check the error details and verify API configuration.';
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">Please log in to view authentication logs.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading authentication logs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Authentication Logs</CardTitle>
            <CardDescription>
              Rapaport OAuth attempts with diagnostic information and automated fixes
            </CardDescription>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No authentication logs found.</p>
          ) : (
            logs.map((log) => {
              const errorCategory = getErrorCategory(log.error_message);
              const errorSolution = getErrorSolution(log.error_message);
              const isDetailsVisible = showDetails[log.id];
              
              return (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-medium">{getEventTypeLabel(log.event_type)}</span>
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'failure' ? 'destructive' : 'secondary'} className="text-xs">
                          {log.status}
                        </Badge>
                        {errorCategory && (
                          <Badge variant="outline" className="text-xs">
                            {errorCategory}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Store ID: {log.store_id}</p>
                        {log.code_fragment && (
                          <p>Code: {log.code_fragment}...</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp || log.created_at).toLocaleString()}
                      </p>
                      
                      {log.error_message && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDetails(log.id)}
                              className="h-6 px-2 text-xs"
                            >
                              {isDetailsVisible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              {isDetailsVisible ? 'Hide' : 'Show'} Details
                            </Button>
                          </div>
                          
                          {isDetailsVisible && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
                              <div className="mb-2">
                                <strong className="text-red-800">Error Message:</strong>
                                <p className="text-red-700 mt-1 font-mono text-xs break-all">{log.error_message}</p>
                              </div>
                              {errorSolution && (
                                <div>
                                  <strong className="text-red-800">Automated Fix/Solution:</strong>
                                  <p className="text-red-700 mt-1">{errorSolution}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RapaportAuthLogger;