
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Sale, Product } from "@/types";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const salesSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  saleType: z.enum(["inventory", "adhoc"]),
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
}).refine(data => {
    if (data.saleType === 'inventory') {
        return !!data.product_id;
    }
    return true;
}, {
    message: "Please select a product.",
    path: ["product_id"],
}).refine(data => {
    if (data.saleType === 'adhoc') {
        return !!data.product_name && data.product_name.length > 0;
    }
    return true;
}, {
    message: "Product name is required for ad-hoc sales.",
    path: ["product_name"],
}).refine(data => {
    if (data.saleType === 'adhoc') {
        return data.price !== undefined && data.price > 0;
    }
    return true;
}, {
    message: "Price must be greater than 0 for ad-hoc sales.",
    path: ["price"],
});

function SalesPageContent() {
  const { supabase, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const [saleType, setSaleType] = useState<"inventory" | "adhoc">("inventory");

  const fetchSales = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        products ( name )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast({ title: "Error fetching sales", description: error.message, variant: "destructive" });
    } else {
      const formattedData = data.map((d: any) => ({ ...d, product_name: d.products ? d.products.name : d.product_name }));
      setSales(formattedData as Sale[]);
    }
  }, [supabase, user, toast]);

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    } else {
      setProducts(data as Product[]);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  const form = useForm<z.infer<typeof salesSchema>>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
      saleType: "inventory",
    },
  });

  async function onSubmit(values: z.infer<typeof salesSchema>) {
    if (!user) return;
    
    let amount = 0;
    let productId = null;
    let productName = null;

    if (values.saleType === "inventory") {
      const product = products.find((p) => p.id === values.product_id);
      if (!product) {
        toast({ title: "Error", description: "Product not found.", variant: "destructive" });
        return;
      }
      if (product.quantity < values.quantity) {
        toast({ title: "Error", description: `Not enough stock for ${product.name}. Available: ${product.quantity}`, variant: "destructive" });
        return;
      }
      amount = product.selling_price * values.quantity;
      productId = product.id;
      productName = product.name;
    } else { // Ad-hoc sale
      if(!values.price || !values.product_name) {
        // This should be caught by schema validation, but as a safeguard.
        toast({ title: "Error", description: "Product name and price are required for ad-hoc sales.", variant: "destructive" });
        return;
      }
      amount = values.price * values.quantity;
      productName = values.product_name;
    }

    const { error } = await supabase.rpc('record_sale', {
        p_product_id: productId,
        p_quantity: values.quantity,
        p_amount: amount,
        p_date: values.date.toISOString(),
        p_user_id: user.id,
        p_product_name: productName,
    })

    if (error) {
       toast({ title: "Error recording sale", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Sale has been added." });
      form.reset({
        date: new Date(),
        quantity: 1,
        saleType: saleType,
        product_id: "",
        product_name: "",
        price: 0,
      });
      fetchSales();
      if(values.saleType === "inventory") fetchProducts();
    }
  }
  
  async function deleteSale(sale: Sale) {
    if(!user) return;
    const { error } = await supabase.rpc('delete_sale', {
        p_sale_id: sale.id,
        p_product_id: sale.product_id,
        p_quantity: sale.quantity,
        p_user_id: user.id,
        p_product_name: sale.product_name,
    });

    if (error) {
       toast({ title: "Error deleting sale", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Sale Deleted", description: "The sale record has been removed.", variant: "destructive" });
        fetchSales();
        if(sale.product_id) fetchProducts();
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };
  
  const watchedSaleType = form.watch("saleType");

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in">
      <PageHeader
        title="Daily Sales"
        description="Record your total sales for each day."
      />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Sale
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
                      <FormLabel>Date of Sale</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn( "w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                  name="saleType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Sale Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="inventory" />
                            </FormControl>
                            <FormLabel className="font-normal">Inventory Product</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="adhoc" />
                            </FormControl>
                            <FormLabel className="font-normal">Ad-Hoc Product</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedSaleType === "inventory" ? (
                    <FormField
                      control={form.control}
                      name="product_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product from inventory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} (Stock: {p.quantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="product_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Special Latte" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per unit</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5.50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Sold</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  Add Sale
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length > 0 ? (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.date), "PPP")}</TableCell>
                        <TableCell>{sale.product_name}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                         <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteSale(sale)} title="Delete Sale">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        No sales recorded yet.
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

export default function SalesPage() {
    return (
        <ProtectedLayout>
            <SalesPageContent />
        </ProtectedLayout>
    )
}

    