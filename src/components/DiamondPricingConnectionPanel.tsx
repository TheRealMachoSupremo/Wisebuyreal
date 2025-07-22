import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RapaportConnectionStatus from './RapaportConnectionStatus';
import RapaportAuthButton from './RapaportAuthButton';
import StoreDiamondPricingPanel from './StoreDiamondPricingPanel';
import useRapaportAuth from '@/hooks/useRapaportAuth';
import { useAppContext } from '@/contexts/AppContext';

const DiamondPricingConnectionPanel: React.FC = () => {
  const { currentStore } = useAppContext();
  const { token, refetch } = useRapaportAuth(currentStore?.id);

  const handleAuthSuccess = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rapaport Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RapaportConnectionStatus />
          <div className="flex space-x-2">
            <RapaportAuthButton onAuthSuccess={handleAuthSuccess} />
          </div>
        </CardContent>
      </Card>
      
      {token && <StoreDiamondPricingPanel />}
    </div>
  );
};

export default DiamondPricingConnectionPanel;