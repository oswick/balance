"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Pencil } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Product } from "@/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import ProtectedLayout from "../protected-layout";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  selling_price: z.coerce.number().min(0, "Selling price cannot be negative."),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
});

export default function ProductsPage() {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    else setProducts(data as Product[]);
  }, [supabase, user, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const editForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        name: editingProduct.name,
        selling_price: editingProduct.selling_price,
        quantity: editingProduct.quantity,
      });
    }
  }, [editingProduct, editForm]);

  async function onEditSubmit(values: z.infer<typeof productSchema>) {
    if (!editingProduct) return;
    const { error } = await supabase
      .from('products')
      .update(values)
      .eq('id', editingProduct.id);

    if (error) toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Product Updated", description: "The product details have been saved." });
      setEditingProduct(null);
      fetchProducts();
    }
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Product Deleted", description: "The product has been removed from your catalog.", variant: "destructive" });
      fetchProducts();
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(amount);

  const calculateUnitProfit = (product: Product) => product.selling_price - (product.cost_per_unit || 0);

  return (
    <ProtectedLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader title="Product Catalog" description="View and manage your product information." />

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost per Unit</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Unit Profit</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.cost_per_unit || 0)}</TableCell>
                        <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                        <TableCell className={`font-medium ${calculateUnitProfit(product) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(calculateUnitProfit(product))}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} title="Edit Product">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} title="Delete Product">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          No products found. Add products in the Inventory section.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
          <DialogContent className="w-[90vw] md:w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Make changes to your product here. Click save when you're done. Cost per unit is not editable.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Artisan Bread" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="selling_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price</FormLabel>
                    <FormControl><Input type="number" placeholder="5.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedLayout>
  );
}
