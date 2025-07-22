import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useDevLogger } from '@/hooks/useDevLogger';
import LoginForm from './LoginForm';
import StoreRegistration from './StoreRegistration';
import DeveloperDashboard from './DeveloperDashboard';
import StoreHomepage from './StoreHomepage';
import AdminPanel from './AdminPanel';

const AppLayout: React.FC = () => {
  const { currentUser } = useAppContext();
  const log = useDevLogger('AppLayout');
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'homepage' | 'admin'>('login');

  log.debug('AppLayout rendering', { currentUser: currentUser?.email, currentView });

  // If no user is logged in, show login or registration
  if (!currentUser) {
    log.info('No user logged in, showing auth forms');
    if (currentView === 'register') {
      log.debug('Showing registration form');
      return (
        <StoreRegistration onBack={() => {
          log.debug('Navigating back to login');
          setCurrentView('login');
        }} />
      );
    }
    log.debug('Showing login form');
    return (
      <LoginForm onShowRegistration={() => {
        log.debug('Navigating to registration');
        setCurrentView('register');
      }} />
    );
  }

  // Developer view - developer can access dashboard with their credentials
  if (currentUser.role === 'developer') {
    log.info('Rendering developer dashboard', { userId: currentUser.id });
    return <DeveloperDashboard />;
  }

  // Store admin/user views
  if (currentView === 'admin' && currentUser.role === 'store_admin') {
    log.info('Rendering admin panel', { storeId: currentUser.storeId });
    return <AdminPanel onBack={() => {
      log.debug('Navigating back to homepage from admin');
      setCurrentView('homepage');
    }} />;
  }

  // Default store homepage for approved stores
  log.info('Rendering store homepage', { storeId: currentUser.storeId });
  return (
    <StoreHomepage onShowAdminPanel={() => {
      log.debug('Navigating to admin panel');
      setCurrentView('admin');
    }} />
  );
};

export default AppLayout;