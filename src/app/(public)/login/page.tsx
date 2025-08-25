
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.6-4.84 1.6-4.48 0-8.12-3.64-8.12-8.12s3.64-8.12 8.12-8.12c2.42 0 4.09.93 5.37 2.1l2.5-2.5C20.04 2.38 17.02 1 12.48 1 5.83 1 1 5.83 1 12.48s4.83 11.48 11.48 11.48c6.48 0 11.2-4.59 11.2-11.36 0-.79-.07-1.44-.2-2.04h-11.2z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}

export default function LoginPage() {
  const { supabase, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive"
      });
      console.error('Error during login:', error);
    }
  };
  
  if (loading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-background p-4 md:p-24">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-black">LOGIN</CardTitle>
          <CardDescription>Sign in to your Balance account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-3">
          <Button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center"
            variant="outline"
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Login with Google
          </Button>
           <Button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center"
            variant="outline"
          >
            <GithubIcon className="mr-2 h-5 w-5" />
            Login with GitHub
          </Button>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="underline font-semibold hover:text-primary">
            Sign up
        </Link>
      </p>
    </main>
  );
}
