"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Pencil, Package, DollarSign, User, Calendar as CalendarIcon2, Hash } from "lucide-react";
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
import ProtectedLayout from "../protected-layout";

// --- SCHEMAS ---
const purchaseSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  purchaseType: z.enum(["inventory", "adhoc"]),
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  selling_price: z.coerce.number().optional(),
  supplier_id: z.string().min(1, "Please select a supplier."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  total_cost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
}).refine(data => data.purchaseType === "inventory" ? !!data.product_id : true, {
  message: "Please select a product.",
  path: ["product_id"],
}).refine(data => data.purchaseType === "adhoc" ? !!data.product_name : true, {
  message: "Product name is required for new products.",
  path: ["product_name"],
}).refine(data => data.purchaseType === "adhoc" ? data.selling_price !== undefined && data.selling_price >= 0 : true, {
  message: "Selling price is required for new products.",
  path: ["selling_price"],
});

const editPurchaseSchema = z.object({
  date: z.date(),
  supplier_id: z.string().min(1),
  quantity: z.coerce.number().min(1),
  total_cost: z.coerce.number().min(0.01),
});

export default function PurchasesPage() {
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

  // Sync editing form
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

  // --- FETCH DATA ---
  const fetchPurchases = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select(`*, products(name), suppliers(name)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) toast({ title: "Error fetching purchases", description: error.message, variant: "destructive" });
    else setPurchases(data.map((d: any) => ({
      ...d,
      product_name: d.products?.name || d.product_name || "N/A",
      supplier_name: d.suppliers?.name || "N/A",
    })));
  }, [supabase, user, toast]);

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id);
    if (error) toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    else setProducts(data);
  }, [supabase, user, toast]);

  const fetchSuppliers = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', user.id);
    if (error) toast({ title: "Error fetching suppliers", description: error.message, variant: "destructive" });
    else setSuppliers(data);
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
    fetchSuppliers();
  }, [fetchPurchases, fetchProducts, fetchSuppliers]);

  // --- SUBMIT FUNCTIONS ---
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

    if (error) return toast({ title: "Error logging purchase", description: error.message, variant: "destructive" });
    toast({ title: "Success!", description: "Purchase logged." });
    form.reset({ date: new Date(), quantity: 1, purchaseType: "inventory", product_id: "", supplier_id: "", total_cost: 0, product_name: "", selling_price: 0 });
    fetchPurchases();
    fetchProducts();
  }

  async function onEditSubmit(values: z.infer<typeof editPurchaseSchema>) {
    if (!editingPurchase) return;
    const { error } = await supabase.from('purchases').update({
      date: values.date.toISOString(),
      supplier_id: values.supplier_id,
      quantity: values.quantity,
      total_cost: values.total_cost,
    }).eq('id', editingPurchase.id);

    if (error) toast({ title: "Error updating purchase", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Purchase Updated", description: "Purchase details saved." });
      setEditingPurchase(null);
      fetchPurchases();
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  const watchedPurchaseType = form.watch("purchaseType");

  // Mobile Purchase Card Component
  const PurchaseCard = ({ purchase }: { purchase: Purchase }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-2">
            <h3 className="font-semibold text-base truncate">{purchase.product_name}</h3>
            <p className="text-sm text-muted-foreground">{format(new Date(purchase.date), "MMM d, yyyy")}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingPurchase(purchase)} 
            title="Edit Purchase"
            className="p-2 h-8 w-8 flex-shrink-0"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Supplier</p>
              <p className="font-medium truncate">{purchase.supplier_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Quantity</p>
              <p className="font-medium">{purchase.quantity}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 col-span-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Total Cost</p>
              <p className="font-medium text-lg">{formatCurrency(purchase.total_cost)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedLayout>
      <div className="space-y-4 p-4 pt-6">
        <PageHeader title="Product Purchases" description="Record product purchases, supplier, and cost details." />

        {/* Mobile: Stacked Layout */}
        <div className="space-y-6 lg:hidden">
          {/* Form Card - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlusCircle className="h-5 w-5" /> Log New Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Purchase Type */}
                  <FormField control={form.control} name="purchaseType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-medium">Purchase Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("product_id", "");
                            form.setValue("product_name", "");
                            form.setValue("selling_price", 0);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="inventory" /></FormControl>
                            <FormLabel className="font-normal text-sm">Inventory Product</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="adhoc" /></FormControl>
                            <FormLabel className="font-normal text-sm">New Product</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Date */}
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm">Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal text-base", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[95vw] max-w-sm p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={d => d > new Date() || d < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Conditional Product Fields */}
                  {watchedPurchaseType === "inventory" ? (
                    <FormField control={form.control} name="product_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Product</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-base">
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ) : (
                    <div className="space-y-4">
                      <FormField control={form.control} name="product_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">New Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Organic Flour" {...field} className="text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="selling_price" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Selling Price (per unit)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5.99" {...field} className="text-base" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {/* Supplier */}
                  <FormField control={form.control} name="supplier_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Quantity & Total Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} className="text-base" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="total_cost" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Total Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="250.00" {...field} className="text-base" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="w-full">Log Purchase</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Purchase History - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase History</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {purchases.length > 0 ? (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <PurchaseCard key={purchase.id} purchase={purchase} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No purchases logged yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Start by logging your first purchase above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop: Original Grid Layout */}
        <div className="hidden lg:grid gap-6 grid-cols-3">
          {/* Form Card - Desktop */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Log New Purchase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Purchase Type */}
                  <FormField control={form.control} name="purchaseType" render={({ field }) => (
                    <FormItem className="space-y-2">
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
                          className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="inventory" /></FormControl>
                            <FormLabel className="font-normal">Inventory Product</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="adhoc" /></FormControl>
                            <FormLabel className="font-normal">New Product</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Date */}
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={d => d > new Date() || d < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Conditional Product Fields */}
                  {watchedPurchaseType === "inventory" ? (
                    <FormField control={form.control} name="product_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ) : (
                    <>
                      <FormField control={form.control} name="product_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Product Name</FormLabel>
                          <FormControl><Input placeholder="Organic Flour" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="selling_price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price (per unit)</FormLabel>
                          <FormControl><Input type="number" placeholder="5.99" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}

                  {/* Supplier */}
                  <FormField control={form.control} name="supplier_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger></FormControl>
                        <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Quantity & Total Cost */}
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="total_cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Cost</FormLabel>
                      <FormControl><Input type="number" placeholder="250.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full">Log Purchase</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Purchase Table - Desktop */}
          <Card className="col-span-2">
            <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px]">
                <Table className="min-w-[600px]">
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
                    {purchases.length > 0 ? purchases.map(purchase => (
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
                    )) : (
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

        {/* Edit Dialog - Mobile Optimized */}
        <Dialog open={!!editingPurchase} onOpenChange={(isOpen) => !isOpen && setEditingPurchase(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Purchase</DialogTitle>
              <DialogDescription className="text-sm">Update details. Editing does not affect stock levels.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField control={editForm.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm">Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal text-base", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[90vw] max-w-sm p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={d => d > new Date() || d < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={editForm.control} name="supplier_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Quantity</FormLabel>
                      <FormControl><Input type="number" {...field} className="text-base" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={editForm.control} name="total_cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Total Cost</FormLabel>
                      <FormControl><Input type="number" {...field} className="text-base" step="0.01" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end pt-4">
                  <DialogClose asChild>
                    <Button variant="secondary" type="button" className="w-full sm:w-auto">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  );
}