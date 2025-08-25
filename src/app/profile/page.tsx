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
import { deleteUserAccount } from "@/lib/actions";
import { useAuth } from "@/context/auth-provider";
import { Loader2, Clock, Calendar } from "lucide-react";
import type { BusinessProfile } from "@/types";

const profileSchema = z.object({
  name: z.string().min(1, "Business name is required.").nullable(),
  business_type: z.string().min(1, "Business type is required.").nullable(),
  operating_days: z.array(z.string()).optional(),
  opening_time: z.string().nullable(),
  closing_time: z.string().nullable(),
  product_types: z.string().nullable(),
});

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const display = `${hour12}:00 ${ampm}`;
  const value = `${hour.toString().padStart(2, '0')}:00`;
  return { value, display };
});

// Componente para seleccionar días
const DaySelector = ({ value = [], onChange }: { 
  value?: string[], 
  onChange: (days: string[]) => void 
}) => {
  const handleDayToggle = (dayId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, dayId]);
    } else {
      onChange(value.filter(d => d !== dayId));
    }
  };

  const selectAll = () => {
    onChange(DAYS_OF_WEEK.map(day => day.id));
  };

  const selectWeekdays = () => {
    onChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectWeekend = () => {
    onChange(['saturday', 'sunday']);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectWeekdays}>
          Mon-Fri
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectWeekend}>
          Weekend
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectAll}>
          All Days
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          Clear
        </Button>
      </div>

      {/* Day checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.id} className="flex items-center space-x-2">
            <Checkbox
              id={day.id}
              checked={value.includes(day.id)}
              onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
              className="border-2"
            />
            <label
              htmlFor={day.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Selected days preview */}
      {value.length > 0 && (
        <div className="mt-3 p-3 bg-accent rounded-md">
          <p className="text-sm font-medium mb-1">Selected days:</p>
          <p className="text-sm text-muted-foreground">
            {value.length === 7 
              ? "Every day" 
              : value.length === 5 && !value.includes('saturday') && !value.includes('sunday')
              ? "Monday to Friday"
              : value.length === 2 && value.includes('saturday') && value.includes('sunday')
              ? "Weekends only"
              : value.map(dayId => DAYS_OF_WEEK.find(d => d.id === dayId)?.short).join(', ')
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Componente para seleccionar horarios
const TimeSelector = ({ 
  openingTime, 
  closingTime, 
  onOpeningTimeChange, 
  onClosingTimeChange 
}: {
  openingTime?: string | null,
  closingTime?: string | null,
  onOpeningTimeChange: (time: string) => void,
  onClosingTimeChange: (time: string) => void
}) => {
  const setCommonHours = (opening: string, closing: string) => {
    onOpeningTimeChange(opening);
    onClosingTimeChange(closing);
  };

  return (
    <div className="space-y-4">
      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setCommonHours('09:00', '17:00')}
        >
          9AM - 5PM
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setCommonHours('08:00', '18:00')}
        >
          8AM - 6PM
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setCommonHours('07:00', '19:00')}
        >
          7AM - 7PM
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setCommonHours('00:00', '23:59')}
        >
          24/7
        </Button>
      </div>

      {/* Time selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Opening Time
          </label>
          <Select value={openingTime || ""} onValueChange={onOpeningTimeChange}>
            <SelectTrigger className="border-2">
              <SelectValue placeholder="Select opening time" />
            </SelectTrigger>
            <SelectContent className="border-2 border-border bg-background shadow-brutal">
              {HOURS.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Closing Time
          </label>
          <Select value={closingTime || ""} onValueChange={onClosingTimeChange}>
            <SelectTrigger className="border-2">
              <SelectValue placeholder="Select closing time" />
            </SelectTrigger>
            <SelectContent className="border-2 border-border bg-background shadow-brutal">
              {HOURS.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hours preview */}
      {openingTime && closingTime && (
        <div className="mt-3 p-3 bg-accent rounded-md">
          <p className="text-sm font-medium mb-1">Business hours:</p>
          <p className="text-sm text-muted-foreground">
            {HOURS.find(h => h.value === openingTime)?.display} - {HOURS.find(h => h.value === closingTime)?.display}
          </p>
          {openingTime === '00:00' && closingTime === '23:59' && (
            <p className="text-xs text-muted-foreground mt-1">Open 24 hours</p>
          )}
        </div>
      )}
    </div>
  );
};

export default function ProfilePage() {
  const { user, supabase } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      business_type: "",
      operating_days: [],
      opening_time: "",
      closing_time: "",
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
        const days = data.operating_days ? JSON.parse(data.operating_days) : [];
        setOperatingDays(days);
        
        form.reset({
          name: data.name || "",
          business_type: data.business_type || "",
          operating_days: days,
          opening_time: data.opening_time || "",
          closing_time: data.closing_time || "",
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
        name: values.name,
        business_type: values.business_type,
        operating_days: JSON.stringify(operatingDays),
        opening_time: values.opening_time,
        closing_time: values.closing_time,
        product_types: values.product_types,
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
                          <Input 
                            placeholder="e.g., The Daily Grind" 
                            {...field} 
                            value={field.value || ''} 
                            className="border-2"
                          />
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
                          <Input 
                            placeholder="e.g., Coffee Shop" 
                            {...field} 
                            value={field.value || ''} 
                            className="border-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Operating Days */}
                <div className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Operating Days
                  </FormLabel>
                  <DaySelector 
                    value={operatingDays} 
                    onChange={setOperatingDays} 
                  />
                </div>

                {/* Business Hours */}
                <div className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </FormLabel>
                  <TimeSelector
                    openingTime={form.watch("opening_time")}
                    closingTime={form.watch("closing_time")}
                    onOpeningTimeChange={(time) => form.setValue("opening_time", time)}
                    onClosingTimeChange={(time) => form.setValue("closing_time", time)}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="product_types"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Product Types</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Coffee, Pastries, Sandwiches" 
                          {...field} 
                          value={field.value || ''} 
                          className="border-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <AlertDialogContent className="border-2 border-border shadow-brutal">
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