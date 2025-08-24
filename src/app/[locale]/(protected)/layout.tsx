"use client"

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import { Shortcuts } from '@/components/shortcuts';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return; 

        const isLoginPage = pathname.includes('/login');

        if (!user && !isLoginPage) {
            router.push('/login');
        }
        
        if (user && isLoginPage) {
            router.push('/');
        }

    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-lg font-semibold">Loading...</div>
            </div>
        );
    }
    
    if (pathname.includes('/login')) {
      return <>{children}</>
    }

    if(!user) {
        return null;
    }

    return (
        <MainLayout>
            <Shortcuts />
            {children}
        </MainLayout>
    );
};

export default ProtectedLayout;