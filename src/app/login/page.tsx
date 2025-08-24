'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-provider';
import ProtectedLayout from '../(protected)/layout';

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

function LoginPageContent() {
  const { supabase } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-24">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Sign in to your Balance account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleLogin} className="w-full" variant="outline">
            <GoogleIcon className="mr-2 h-4 w-4" />
            Login with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}


export default function LoginPage() {
    return (
        <ProtectedLayout>
            <LoginPageContent />
        </ProtectedLayout>
    )
}
