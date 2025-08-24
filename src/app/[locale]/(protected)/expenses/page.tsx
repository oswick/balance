
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Expense } from "@/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import ProtectedLayout from "../layout";
import { useTranslations } from "next-intl";

const expenseSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  category: z.string().min(1, "Category is required."),
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
});

type CombinedExpense = Expense & { isPurchase?: boolean, productName?: string };

function ExpensesPageContent() {
  const { supabase, user } = useAuth();
  const [expenses, setExpenses] = useState<CombinedExpense[]>([]);
  const { toast } = useToast();
  const t = useTranslations('Expenses');

  const fetchExpensesAndPurchases = React.useCallback(async () => {
    if (!user) return;
    
    // Fetch regular expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id);

    if (expensesError) {
      toast({ title: t('errors.fetchExpenses'), description: expensesError.message, variant: "destructive" });
      return;
    }

    // Fetch purchases
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('*, products(name)')
      .eq('user_id', user.id);
      
    if (purchasesError) {
      toast({ title: t('errors.fetchPurchases'), description: purchasesError.message, variant: "destructive" });
      return;
    }

    // Combine and format
    const combined = [
      ...(expensesData || []).map(e => ({...e, isPurchase: false})),
      ...(purchasesData || []).map((p: any) => ({
        id: p.id,
        date: p.date,
        category: t('purchaseCategory'),
        description: `${t('purchaseOf')} ${p.products.name}`,
        amount: p.total_cost,
        user_id: p.user_id,
        created_at: p.created_at,
        isPurchase: true,
        productName: p.products.name,
      }))
    ];
    
    // Sort by date descending
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setExpenses(combined);

  }, [supabase, user, toast, t]);


  useEffect(() => {
    fetchExpensesAndPurchases();
  }, [fetchExpensesAndPurchases]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      category: "",
      description: "",
      amount: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!user) return;

    const newExpense = {
      ...values,
      date: values.date.toISOString(),
      user_id: user.id,
    };
    
    const { error } = await supabase.from('expenses').insert([newExpense]);
    
    if (error) {
      toast({ title: t('errors.add'), description: error.message, variant: "destructive" });
    } else {
      toast({
        title: t('success.addTitle'),
        description: t('success.addDesc'),
      });
      form.reset({
        date: new Date(),
        category: "",
        description: "",
        amount: 0,
      });
      fetchExpensesAndPurchases();
    }
  }
  
  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if(error) {
       toast({
        title: t('errors.delete'),
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDesc'),
        variant: "destructive",
      })
      fetchExpensesAndPurchases();
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              {t('addForm.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('addForm.date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t('addForm.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.description')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('addForm.descriptionPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.category')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('addForm.categoryPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.amount')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="250.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {t('addForm.submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('history.title')}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="max-h-[480px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('history.date')}</TableHead>
                    <TableHead>{t('history.description')}</TableHead>
                    <TableHead>{t('history.category')}</TableHead>
                    <TableHead className="text-right">{t('history.amount')}</TableHead>
                    <TableHead className="text-right">{t('history.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length > 0 ? (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), "PPP")}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteExpense(expense.id)}
                              disabled={expense.isPurchase}
                              title={expense.isPurchase ? t('history.deleteDisabled') : t('history.deleteTooltip')}
                            >
                              <Trash2 className={`h-4 w-4 ${!expense.isPurchase && 'text-destructive'}`} />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        {t('history.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


export default function ExpensesPage() {
    return (
        <ProtectedLayout>
            <ExpensesPageContent />
        </ProtectedLayout>
    )
}
