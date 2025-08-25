"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../../protected-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { signUpWithEmailAndPassword } from "@/lib/actions";
import { Loader2, Clock, Calendar, Building, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import type { BusinessProfile } from "@/types";
import { useAuth } from "@/context/auth-provider";
import Link from "next/link";


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

const signUpSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export default function SignUpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { supabase } = useAuth();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Sign-up Error",
        description: error.message,
        variant: "destructive"
      });
      console.error('Error during Google sign-up:', error);
    }
  };

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    setIsSubmitting(true);
    
    const result = await signUpWithEmailAndPassword({
      email: values.email,
      password: values.password,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast({ title: "Sign-up failed", description: result.error, variant: "destructive" });
    } else {
        setEmailSent(true);
    }
  }

  return (
     <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-black text-center">Create Your Account</CardTitle>
                 <CardDescription className="text-center">
                    Join to start managing your business finances.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {emailSent ? (
                    <div className="text-center space-y-4 animate-in p-8">
                        <MailCheck className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="text-xl font-bold">Check your email</h3>
                        <p className="text-muted-foreground">
                            We've sent a verification link to your email address. Please click the link to continue.
                        </p>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <Button onClick={handleGoogleSignUp} className="w-full" variant="outline">
                                <GoogleIcon className="mr-2 h-5 w-5" />
                                Sign up with Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6 mt-4">
                                <div className="space-y-4 animate-in">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                                        ) : (
                                            "Create Account with Email"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>

                        <p className="mt-6 text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="underline font-semibold hover:text-primary">
                                Log in
                            </Link>
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
     </main>
  );
}
