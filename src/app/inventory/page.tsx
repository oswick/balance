"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import ProtectedLayout from "../protected-layout";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  purchase_price: z.coerce.number().min(0, "Purchase price cannot be negative."),
  selling_price: z.coerce.number().min(0, "Selling price cannot be negative."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

export default function InventoryPage() {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts(data as Product[]);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      purchase_price: 0,
      selling_price: 0,
      quantity: 1,
    },
  });

  async function onAddSubmit(values: z.infer<typeof productSchema>) {
    if (!user) return;

    const cost_per_unit =
      values.quantity > 0 ? values.purchase_price / values.quantity : 0;

    const { error } = await supabase
      .from("products")
      .insert([{ ...values, user_id: user.id, cost_per_unit }]);

    if (error) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Product has been added to your inventory.",
      });
      form.reset({
        name: "",
        purchase_price: 0,
        selling_price: 0,
        quantity: 1,
      });
      fetchProducts();
    }
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product Deleted",
        description: "The product has been removed from your inventory.",
        variant: "destructive",
      });
      fetchProducts();
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <ProtectedLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader
          title="Inventory"
          description="Add and manage products in your inventory."
        />
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Formulario */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onAddSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Artisan Bread"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Purchase Price (for the whole quantity)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3.50"
                            {...field}
                            className="w-full"
                          />
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
                          <Input
                            type="number"
                            placeholder="0.35"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Add Product
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[480px]">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost per Unit</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.cost_per_unit || 0)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.selling_price)}
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProduct(product.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No products in inventory.
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
    </ProtectedLayout>
  );
}
