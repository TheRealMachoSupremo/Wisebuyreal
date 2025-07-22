import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'developer' | 'store_admin' | 'store_user';
  storeId?: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  status: 'pending' | 'active' | 'rejected';
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  metalMarkup: {
    gold: number;
    silver: number;
    platinum: number;
  };
  pricing_basis?: string;
  discount?: number;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentUser: User | null;
  currentStore: Store | null;
  stores: Store[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerStore: (data: any) => void;
  approveStore: (storeId: string) => void;
  rejectStore: (storeId: string) => void;
  loadStores: () => Promise<void>;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  currentUser: null,
  currentStore: null,
  stores: [],
  login: async () => false,
  logout: () => {},
  registerStore: () => {},
  approveStore: () => {},
  rejectStore: () => {},
  loadStores: async () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*');
      
      if (error) throw error;
      
      const mappedStores: Store[] = data.map(store => ({
        id: store.id,
        name: store.store_name,
        address: store.store_address,
        phone: store.store_phone,
        website: store.store_website,
        status: store.status,
        adminEmail: store.admin_email,
        adminName: store.admin_name,
        adminPassword: store.admin_password,
        metalMarkup: {
          gold: store.gold_markup || 20,
          silver: store.silver_markup || 15,
          platinum: store.platinum_markup || 25
        },
        pricing_basis: store.pricing_basis || 'YEOB',
        discount: store.discount || 10
      }));
      
      setStores(mappedStores);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Developer login
    if (email === 'robby@smithsonthesquare.com' && password === 'Tontoman') {
      setCurrentUser({
        id: 'dev-1',
        email: 'robby@smithsonthesquare.com',
        name: 'Developer',
        role: 'developer'
      });
      return true;
    }

    // Store admin login - check database
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('admin_email', email)
        .eq('admin_password', password)
        .eq('status', 'active')
        .single();
      
      if (error || !data) {
        return false;
      }
      
      const store: Store = {
        id: data.id,
        name: data.store_name,
        address: data.store_address,
        phone: data.store_phone,
        website: data.store_website,
        status: data.status,
        adminEmail: data.admin_email,
        adminName: data.admin_name,
        adminPassword: data.admin_password,
        metalMarkup: {
          gold: data.gold_markup || 20,
          silver: data.silver_markup || 15,
          platinum: data.platinum_markup || 25
        },
        pricing_basis: data.pricing_basis || 'YEOB',
        discount: data.discount || 10
      };
      
      setCurrentUser({
        id: data.id,
        email: data.admin_email,
        name: data.admin_name,
        role: 'store_admin',
        storeId: data.id
      });
      
      setCurrentStore(store);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentStore(null);
  };

  const registerStore = (data: any) => {
    const newStore: Store = {
      id: data.id || crypto.randomUUID(),
      name: data.storeName,
      address: data.storeAddress,
      phone: data.storePhone,
      website: data.storeWebsite,
      status: 'pending',
      adminEmail: data.adminEmail,
      adminName: data.adminName,
      adminPassword: data.adminPassword,
      metalMarkup: data.metalMarkup || { gold: 20, silver: 15, platinum: 25 },
      pricing_basis: 'YEOB',
      discount: 10
    };
    setStores(prev => [...prev, newStore]);
    toast({ title: 'Store registration submitted', description: `Store ID: ${newStore.id}` });
  };

  const approveStore = (storeId: string) => {
    setStores(prev => prev.map(store => 
      store.id === storeId ? { ...store, status: 'active' as const } : store
    ));
    toast({ title: 'Store approved', description: `Store ${storeId} is now active` });
  };

  const rejectStore = (storeId: string) => {
    setStores(prev => prev.map(store => 
      store.id === storeId ? { ...store, status: 'rejected' as const } : store
    ));
    toast({ title: 'Store rejected', description: `Store ${storeId} registration denied` });
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        currentUser,
        currentStore,
        stores,
        login,
        logout,
        registerStore,
        approveStore,
        rejectStore,
        loadStores,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};