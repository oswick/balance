'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type SupabaseContext = {
  supabase: SupabaseClient;
  user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        router.push('/');
      }
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    
    // Initial check
    supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
            router.push('/login');
        } else {
            setUser(data.user)
        }
    })

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <Context.Provider value={{ supabase, user }}>
        {children}
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
