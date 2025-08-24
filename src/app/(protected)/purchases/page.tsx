
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Pencil } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";


const purchaseSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  purchaseType: z.enum(["inventory", "adhoc"]),
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  selling_price: z.coerce.number().optional(),
  supplier_id: z.string().min(1, "Please select a supplier."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  total_cost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
}).refine(data => {
    if (data.purchaseType === 'inventory') {
        return !!data.product_id;
    }
    return true;
}, {
    message: "Please select a product.",
    path: ["product_id"],
}).refine(data => {
    if (data.purchaseType === 'adhoc') {
        return !!data.product_name && data.product_name.length > 0;
    }
    return true;
}, {
    message: "Product name is required for new products.",
    path: ["product_name"],
}).refine(data => {
    if (data.purchaseType === 'adhoc') {
        return data.selling_price !== undefined && data.selling_price >= 0;
    }
    return true;
}, {
    message: "Selling price is required for new products.",
    path: ["selling_price"],
});

const editPurchaseSchema = z.object({
    date: z.date(),
    supplier_id: z.string().min(1, "Supplier is required."),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    total_cost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
});

function PurchasesPageContent() {
  const { supabase, user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
      purchaseType: "inventory",
      product_id: "",
      supplier_id: "",
      total_cost: 0,
      product_name: "",
      selling_price: 0,
    },
  });

  const editForm = useForm<z.infer<typeof editPurchaseSchema>>({
    resolver: zodResolver(editPurchaseSchema),
  });

  useEffect(() => {
    if (editingPurchase) {
      editForm.reset({
        date: new Date(editingPurchase.date),
        supplier_id: editingPurchase.supplier_id || "",
        quantity: editingPurchase.quantity,
        total_cost: editingPurchase.total_cost,
      });
    }
  }, [editingPurchase, editForm]);

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
        product_name: d.products?.name || 'N/A',
        supplier_name: d.suppliers?.name || 'N/A',
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

  async function onSubmit(values: z.infer<typeof purchaseSchema>) {
    if (!user) return;
    
    const cost_per_unit = values.quantity > 0 ? values.total_cost / values.quantity : 0;

    const { error } = await supabase.rpc('record_purchase', {
        p_product_id: values.purchaseType === 'inventory' ? values.product_id : null,
        p_supplier_id: values.supplier_id,
        p_quantity: values.quantity,
        p_total_cost: values.total_cost,
        p_date: values.date.toISOString(),
        p_user_id: user.id,
        p_product_name: values.purchaseType === 'adhoc' ? values.product_name : null,
        p_selling_price: values.purchaseType === 'adhoc' ? values.selling_price : null,
        p_cost_per_unit: cost_per_unit,
    });

    if (error) {
      toast({ title: "Error logging purchase", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Success!",
      description: "Product purchase has been logged.",
    });
    form.reset({ 
      date: new Date(), 
      quantity: 1, 
      purchaseType: "inventory",
      product_id: "",
      supplier_id: "",
      total_cost: 0,
      product_name: "",
      selling_price: 0,
    });
    fetchPurchases();
    fetchProducts();
  }

  async function onEditSubmit(values: z.infer<typeof editPurchaseSchema>) {
    if (!editingPurchase) return;

    const { error } = await supabase
        .from('purchases')
        .update({
            date: values.date.toISOString(),
            supplier_id: values.supplier_id,
            quantity: values.quantity,
            total_cost: values.total_cost,
        })
        .eq('id', editingPurchase.id);

    if (error) {
        toast({ title: "Error updating purchase", description: error.message, variant: "destructive" });
    } else {
        toast({
            title: "Purchase Updated",
            description: "The purchase details have been saved.",
        });
        setEditingPurchase(null);
        fetchPurchases();
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };
  
  const watchedPurchaseType = form.watch("purchaseType");

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Product Purchases"
        description="Record product purchases, supplier, and cost details."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Log New Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="purchaseType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Purchase Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("product_id", "");
                              form.setValue("product_name", "");
                              form.setValue("selling_price", 0);
                          }}
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
                            <FormLabel className="font-normal">New Product</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                
                {watchedPurchaseType === 'inventory' ? (
                    <FormField control={form.control} name="product_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
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
                ) : (
                    <>
                        <FormField
                            control={form.control}
                            name="product_name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New Product Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Organic Flour" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="selling_price"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Selling Price (per unit)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="5.99" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                <FormField control={form.control} name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
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
                      <FormLabel>Total Cost (for the whole quantity)</FormLabel>
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
        <Card className="lg:col-span-2">
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
                          <Button variant="ghost" size="icon" onClick={() => setEditingPurchase(purchase)} title="Edit Purchase">
                            <Pencil className="h-4 w-4" />
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

       <Dialog
        open={!!editingPurchase}
        onOpenChange={(isOpen) => !isOpen && setEditingPurchase(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>
              Update the details of your purchase. Note: Editing a purchase will not affect product stock levels.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
                <FormField
                  control={editForm.control} name="date"
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
                <FormField control={editForm.control} name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
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
                <FormField control={editForm.control} name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={editForm.control} name="total_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Cost</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
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
    
