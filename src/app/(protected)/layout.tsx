"use client"

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import { Shortcuts } from '@/components/shortcuts';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-lg font-semibold">Loading...</div>
            </div>
        );
    }
    
    if(!user) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <div className="text-lg font-semibold">Redirecting to login...</div>
            </div>
        );
    }

    return (
        <MainLayout>
            <Shortcuts />
            {children}
        </MainLayout>
    );
};

export default ProtectedLayout;
