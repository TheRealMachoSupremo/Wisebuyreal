import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { useDevLogger } from '@/hooks/useDevLogger';

const Index: React.FC = () => {
  const log = useDevLogger('IndexPage');
  
  log.info('Index page rendering');
  
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default Index;