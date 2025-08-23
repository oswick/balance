'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';

type SupabaseContext = {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user && (pathname === '/login')) {
         router.push('/');
      }
      
      if (!session?.user && (pathname !== '/login')) {
         router.push('/login');
      }

    });

    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setLoading(false)
        router.push('/login')
        return
      }
      setUser(data.user);
      setLoading(false);
      if (data.user && (pathname === '/login')) {
         router.push('/');
      }
      if (!data.user && (pathname !== '/login')) {
         router.push('/login');
      }
    }
    
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, pathname]);

  const value = {
    supabase,
    user,
    loading,
  };
  
  if (loading) {
    return null; // Or a global loading spinner
  }

  return (
    <Context.Provider value={value}>
        {user ? <MainLayout>{children}</MainLayout> : children}
    </Context.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
