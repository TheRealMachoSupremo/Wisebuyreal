import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import useRapaportAuth from '@/hooks/useRapaportAuth';

const RapaportConnectionStatus: React.FC = () => {
  const { currentStore } = useAppContext();
  const { token } = useRapaportAuth(currentStore?.id);

  const isConnected = token && new Date(token.expires_at) > new Date();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Rapaport Status:</span>
      <Badge variant={isConnected ? 'default' : 'secondary'}>
        {isConnected ? 'Connected' : 'Not Connected'}
      </Badge>
      {token && (
        <span className="text-xs text-muted-foreground">
          Expires: {new Date(token.expires_at).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

export default RapaportConnectionStatus;