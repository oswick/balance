"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../protected-layout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteUserAccount } from "@/lib/actions";
import { useAuth } from "@/context/auth-provider";
import { Loader2 } from "lucide-react";
import type { BusinessProfile } from "@/types";

const profileSchema = z.object({
  name: z.string().min(1, "Business name is required.").nullable(),
  business_type: z.string().min(1, "Business type is required.").nullable(),
  hours: z.string().nullable(),
  product_types: z.string().nullable(),
});

export default function ProfilePage() {
  const { user, supabase } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      business_type: "",
      hours: "",
      product_types: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
        form.reset({
          name: data.name || "",
          business_type: data.business_type || "",
          hours: data.hours || "",
          product_types: data.product_types || "",
        });
      }
    }
    fetchProfile();
  }, [user, supabase, form]);

  async function handleProfileUpdate(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("business_profiles")
      .upsert({
        user_id: user.id,
        ...values,
      }, { onConflict: 'user_id' });
      
    setIsSaving(false);
    
    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your business information has been saved.", variant: "success" });
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      const result = await deleteUserAccount();
      
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all associated data have been successfully deleted.",
          variant: "success",
        });
        await supabase.auth.signOut();
        router.push("/");
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({
        title: "Error Deleting Account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedLayout>
      <PageHeader
        title="Profile"
        description="Manage your profile and account settings."
      />
      <div className="p-4 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Provide general details about your business. This helps in tailoring the experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Daily Grind" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Business</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Coffee Shop" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Hours</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mon-Fri 7am-6pm" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="product_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Product Types</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Coffee, Pastries, Sandwiches" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="p-6 border-2 border-destructive/50 bg-red-50 dark:bg-red-950/20">
            <h3 className="text-lg font-bold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
                Deleting your account is a permanent action. All your data,
                including sales, expenses, and inventory, will be permanently removed.
                This action cannot be undone.
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                         {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : "Delete My Account"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait...
                            </>
                        ) : "Yes, delete my account"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </ProtectedLayout>
  );
}
