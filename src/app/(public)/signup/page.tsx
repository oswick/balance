"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../../protected-layout";
import { Button } from "@/components/ui/button";
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
import { signUpWithBusiness } from "@/lib/actions";
import { Loader2, Clock, Calendar, Building, ArrowRight, ArrowLeft } from "lucide-react";
import type { BusinessProfile } from "@/types";

const signUpSchema = z.object({
  // Step 1
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  
  // Step 2
  businessName: z.string().min(1, "Business name is required."),
  businessType: z.string().min(1, "Business type is required."),
  operatingDays: z.array(z.string()).optional(),
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  productTypes: z.string().nullable(),
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

const DaySelector = ({ value = [], onChange }: { value?: string[], onChange: (days: string[]) => void }) => {
  const handleDayToggle = (dayId: string, checked: boolean) => {
    if (checked) onChange([...value, dayId]);
    else onChange(value.filter(d => d !== dayId));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.id} className="flex items-center space-x-2">
            <Checkbox id={day.id} checked={value.includes(day.id)} onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)} />
            <label htmlFor={day.id} className="text-sm font-medium">{day.short}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimeSelector = ({ openingTime, closingTime, onOpeningTimeChange, onClosingTimeChange }: { openingTime?: string | null, closingTime?: string | null, onOpeningTimeChange: (time: string) => void, onClosingTimeChange: (time: string) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <FormLabel>Opening Time</FormLabel>
      <Select value={openingTime || ""} onValueChange={onOpeningTimeChange}>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.display}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <FormLabel>Closing Time</FormLabel>
      <Select value={closingTime || ""} onValueChange={onClosingTimeChange}>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.display}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>
);

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      businessName: "",
      businessType: "",
      operatingDays: [],
      openingTime: "09:00",
      closingTime: "17:00",
      productTypes: "",
    },
  });

  const handleNextStep = async () => {
    const isValid = await form.trigger(["email", "password"]);
    if (isValid) {
      setStep(2);
    }
  };

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    setIsSubmitting(true);
    
    const result = await signUpWithBusiness({
      email: values.email,
      password: values.password,
      businessProfile: {
        name: values.businessName,
        business_type: values.businessType,
        operating_days: JSON.stringify(values.operatingDays || []),
        opening_time: values.openingTime,
        closing_time: values.closingTime,
        product_types: values.productTypes,
      }
    });

    setIsSubmitting(false);

    if (result.error) {
      toast({ title: "Sign-up failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your account has been created. Please log in.", variant: "success" });
      router.push("/login");
    }
  }

  return (
     <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-black text-center">Create Your Account</CardTitle>
                <CardDescription className="text-center">
                    Step {step} of 2: {step === 1 ? "Account Details" : "Business Information"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6">
                        {step === 1 && (
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
                                <Button type="button" onClick={handleNextStep} className="w-full">
                                    Next <ArrowRight className="ml-2"/>
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in">
                                <FormField control={form.control} name="businessName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Building/> Business Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., The Daily Grind" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="businessType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type of Business</FormLabel>
                                        <FormControl><Input placeholder="e.g., Coffee Shop" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Controller
                                  control={form.control}
                                  name="operatingDays"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel className="flex items-center gap-2"><Calendar/> Operating Days</FormLabel>
                                          <DaySelector value={field.value} onChange={field.onChange} />
                                          <FormMessage />
                                      </FormItem>
                                  )}
                                />
                                <div className="space-y-2">
                                  <FormLabel className="flex items-center gap-2"><Clock/> Business Hours</FormLabel>
                                  <TimeSelector
                                      openingTime={form.watch("openingTime")}
                                      closingTime={form.watch("closingTime")}
                                      onOpeningTimeChange={(time) => form.setValue("openingTime", time)}
                                      onClosingTimeChange={(time) => form.setValue("closingTime", time)}
                                  />
                                </div>
                                <FormField control={form.control} name="productTypes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Main Product Types</FormLabel>
                                        <FormControl><Input placeholder="e.g., Coffee, Pastries, Sandwiches" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                                        <ArrowLeft className="mr-2"/> Back
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Sign Up"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
     </main>
  );
}