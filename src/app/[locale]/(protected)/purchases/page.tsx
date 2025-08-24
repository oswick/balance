
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Purchase, Product, Supplier } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import ProtectedLayout from "../layout";
import { useTranslations } from "next-intl";

const purchaseSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  product_id: z.string().min(1, "Please select a product."),
  supplier_id: z.string().min(1, "Please select a supplier."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  total_cost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
});


function PurchasesPageContent() {
  const { supabase, user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();
  const t = useTranslations("Purchases");
  
  const fetchPurchases = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        products ( name ),
        suppliers ( name )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast({ title: t('errors.fetchPurchases'), description: error.message, variant: "destructive" });
    } else {
      const formattedData = data.map((d: any) => ({ 
        ...d, 
        product_name: d.products.name,
        supplier_name: d.suppliers.name,
      }));
      setPurchases(formattedData as Purchase[]);
    }
  }, [supabase, user, toast, t]);

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id);
    if(error) toast({ title: t('errors.fetchProducts'), description: error.message, variant: "destructive" });
    else setProducts(data as Product[]);
  }, [supabase, user, toast, t]);

  const fetchSuppliers = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', user.id);
    if(error) toast({ title: t('errors.fetchSuppliers'), description: error.message, variant: "destructive" });
    else setSuppliers(data as Supplier[]);
  }, [supabase, user, toast, t]);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
    fetchSuppliers();
  }, [fetchPurchases, fetchProducts, fetchSuppliers]);

  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
      product_id: "",
      supplier_id: "",
      total_cost: 0
    },
  });

  async function onSubmit(values: z.infer<typeof purchaseSchema>) {
    if (!user) return;

    const { error } = await supabase.rpc('record_purchase', {
        p_product_id: values.product_id,
        p_supplier_id: values.supplier_id,
        p_quantity: values.quantity,
        p_total_cost: values.total_cost,
        p_date: values.date.toISOString(),
        p_user_id: user.id
    });

    if (error) {
      toast({ title: t('errors.add'), description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: t('success.addTitle'),
      description: t('success.addDesc'),
    });
    form.reset({ 
      date: new Date(), 
      quantity: 1, 
      product_id: "",
      supplier_id: "",
      total_cost: 0 
    });
    fetchPurchases();
    fetchProducts(); // Refetch products to update stock
  }

  const deletePurchase = async (purchase: Purchase) => {
    if(!user) return;
    const { error } = await supabase.rpc('delete_purchase', {
        p_purchase_id: purchase.id,
        p_product_id: purchase.product_id,
        p_quantity: purchase.quantity,
        p_user_id: user.id
    });
    
    if (error) {
       toast({
        title: t('errors.delete'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDesc'),
        variant: "destructive",
      });
      fetchPurchases();
      fetchProducts(); // Refetch products to update stock
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> {t('addForm.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control} name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('addForm.date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>{t('addForm.pickDate')}</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.product')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('addForm.productPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.supplier')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('addForm.supplierPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.quantity')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="total_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addForm.totalCost')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="250.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">{t('addForm.submit')}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t('history.title')}</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('history.date')}</TableHead>
                    <TableHead>{t('history.product')}</TableHead>
                    <TableHead>{t('history.supplier')}</TableHead>
                    <TableHead>{t('history.quantity')}</TableHead>
                    <TableHead className="text-right">{t('history.totalCost')}</TableHead>
                    <TableHead className="text-right">{t('history.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.date), "PPP")}</TableCell>
                        <TableCell className="font-medium">{purchase.product_name}</TableCell>
                        <TableCell>{purchase.supplier_name}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(purchase.total_cost)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deletePurchase(purchase)} title={t('history.deleteTooltip')}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">{t('history.noData')}</TableCell>
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

export default function PurchasesPage() {
    return (
        <ProtectedLayout>
            <PurchasesPageContent />
        </ProtectedLayout>
    )
}
