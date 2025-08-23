"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
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

const purchaseSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  productId: z.string().min(1, "Please select a product."),
  supplierId: z.string().min(1, "Please select a supplier."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  totalCost: z.coerce.number().min(0.01, "Total cost must be greater than 0."),
});

export default function PurchasesPage() {
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>("purchases", []);
  const [products] = useLocalStorage<Product[]>("products", []);
  const [suppliers] = useLocalStorage<Supplier[]>("suppliers", []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof purchaseSchema>) {
    const product = products.find(p => p.id === values.productId);
    const supplier = suppliers.find(s => s.id === values.supplierId);

    if (!product || !supplier) {
      toast({ title: "Error", description: "Selected product or supplier not found.", variant: "destructive" });
      return;
    }

    const newPurchase: Purchase = {
      id: new Date().toISOString(),
      date: values.date.toISOString(),
      productId: values.productId,
      productName: product.name,
      supplierId: values.supplierId,
      supplierName: supplier.name,
      quantity: values.quantity,
      totalCost: values.totalCost,
    };
    setPurchases([newPurchase, ...purchases]);
    toast({
      title: "Success!",
      description: "Product purchase has been logged.",
    });
    form.reset({ date: new Date(), quantity: 1 });
  }

  const deletePurchase = (id: string) => {
    setPurchases(purchases.filter(p => p.id !== id));
    toast({
      title: "Purchase Deleted",
      description: "The purchase record has been removed.",
      variant: "destructive",
    });
  }

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
                <FormField control={form.control} name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField control={form.control} name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField control={form.control} name="totalCost"
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
                        <TableCell className="font-medium">{purchase.productName}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(purchase.totalCost)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deletePurchase(purchase.id)}>
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
