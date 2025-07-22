import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RapnetCredential {
  id: string;
  store_id: string;
  username: string;
  connection_status: string;
  last_test_date: string | null;
  test_error_message: string | null;
  store_name?: string;
}

interface Store {
  id: string;
  store_name: string;
}

const RapnetAuthStatus: React.FC = () => {
  const [credentials, setCredentials] = useState<RapnetCredential[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, store_name')
        .eq('status', 'active');
      
      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch credentials with store info
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('rapnet_credentials')
        .select(`
          id,
          store_id,
          username,
          connection_status,
          last_test_date,
          test_error_message,
          stores!inner(store_name)
        `);
      
      if (credentialsError) throw credentialsError;
      
      const formattedCredentials = credentialsData?.map(cred => ({
        ...cred,
        store_name: cred.stores?.store_name
      })) || [];
      
      setCredentials(formattedCredentials);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (credentialId: string) => {
    setTesting(credentialId);
    try {
      // Simulate connection test - in real app, this would call Rapnet API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      const { error } = await supabase
        .from('rapnet_credentials')
        .update({
          connection_status: isSuccess ? 'connected' : 'failed',
          last_test_date: new Date().toISOString(),
          test_error_message: isSuccess ? null : 'Authentication failed - invalid credentials',
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error testing connection:', error);
    } finally {
      setTesting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'not_tested':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'not_tested':
        return <Badge variant="secondary">Not Tested</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const storesWithCredentials = stores.filter(store => 
    credentials.some(cred => cred.store_id === store.id)
  );
  
  const storesWithoutCredentials = stores.filter(store => 
    !credentials.some(cred => cred.store_id === store.id)
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Connected</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {credentials.filter(c => c.connection_status === 'connected').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Failed</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {credentials.filter(c => c.connection_status === 'failed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">No Credentials</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {storesWithoutCredentials.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapnet Credentials Status</CardTitle>
          <CardDescription>Monitor Rapnet API connection status for all stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(cred.connection_status)}
                  <div>
                    <h3 className="font-semibold">{cred.store_name}</h3>
                    <p className="text-sm text-gray-600">Username: {cred.username}</p>
                    {cred.last_test_date && (
                      <p className="text-xs text-gray-500">
                        Last tested: {new Date(cred.last_test_date).toLocaleDateString()}
                      </p>
                    )}
                    {cred.test_error_message && (
                      <p className="text-xs text-red-600">{cred.test_error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(cred.connection_status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(cred.id)}
                    disabled={testing === cred.id}
                  >
                    {testing === cred.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {storesWithoutCredentials.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2 text-gray-700">Stores without Rapnet credentials:</h4>
                <div className="space-y-2">
                  {storesWithoutCredentials.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{store.store_name}</span>
                      </div>
                      <Badge variant="outline">No Credentials</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {credentials.length === 0 && storesWithoutCredentials.length === 0 && (
              <p className="text-center text-gray-500 py-8">No stores found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RapnetAuthStatus;