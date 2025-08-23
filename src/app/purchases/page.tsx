
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

const purchaseSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  product_id: z.coerce.number().min(1, "Please select a product."),
  supplier_id: z.coerce.number().min(1, "Please select a supplier."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  total_cost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
});

export default function PurchasesPage() {
  const { supabase, user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();
  
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
      toast({ title: "Error fetching purchases", description: error.message, variant: "destructive" });
    } else {
      const formattedData = data.map((d: any) => ({ 
        ...d, 
        product_name: d.products.name,
        supplier_name: d.suppliers.name,
      }));
      setPurchases(formattedData as Purchase[]);
    }
  }, [supabase, user, toast]);

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id);
    if(error) toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    else setProducts(data as Product[]);
  }, [supabase, user, toast]);

  const fetchSuppliers = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', user.id);
    if(error) toast({ title: "Error fetching suppliers", description: error.message, variant: "destructive" });
    else setSuppliers(data as Supplier[]);
  }, [supabase, user, toast]);

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
      product_id: 0,
      supplier_id: 0,
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
      toast({ title: "Error logging purchase", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Success!",
      description: "Product purchase has been logged.",
    });
    form.reset({ date: new Date(), quantity: 1, product_id: 0, supplier_id: 0, total_cost: 0 });
    fetchPurchases();
  }

  const deletePurchase = async (purchase: Purchase) => {
    const { error } = await supabase.rpc('delete_purchase', {
        p_purchase_id: purchase.id,
        p_product_id: purchase.product_id,
        p_quantity: purchase.quantity
    });
    
    if (error) {
       toast({
        title: "Purchase Deletion Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Purchase Deleted",
        description: "The purchase record has been removed.",
        variant: "destructive",
      });
      fetchPurchases();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Product Purchases"
        description="Record product purchases, supplier, and cost details."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Log New Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control} name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()} value={field.value.toString()} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
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
                      <FormLabel>Total Cost</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="250.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Log Purchase</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <Button variant="ghost" size="icon" onClick={() => deletePurchase(purchase)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">No purchases logged yet.</TableCell>
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
