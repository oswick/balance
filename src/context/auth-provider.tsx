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
  const [supabase] = useState(() => createClient());
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
      
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }
    
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const value = {
    supabase,
    user,
    loading,
  };
  
  if (loading) {
    return null; // Or a global loading spinner
  }

  if (user && pathname === '/login') {
    router.push('/');
    return null; // or a loading spinner
  }

  if (!user && pathname !== '/login') {
    router.push('/login');
    return null; // or a loading spinner
  }

  return (
    <Context.Provider value={value}>
        {pathname === '/login' ? children : <MainLayout>{children}</MainLayout>}
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
