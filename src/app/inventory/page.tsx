"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Copy, Zap, Package, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Product, BusinessProfile } from "@/types";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import ProtectedLayout from "../protected-layout";

// Import our new components
import { QuickAddProductModal } from "@/components/quick-add-modal";
import { ProductDuplicateModal } from "@/components/product-duplicate-modal";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  purchase_price: z.coerce.number().min(0, "Purchase price cannot be negative."),
  selling_price: z.coerce.number().min(0, "Selling price cannot be negative."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

export default function InventoryPage() {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
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
    setIsLoading(false);
  }, [supabase, user, toast]);

  // Obtener perfil del negocio para las plantillas
  const fetchBusinessProfile = React.useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setBusinessProfile(data as BusinessProfile);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchProducts();
    fetchBusinessProfile();
  }, [fetchProducts, fetchBusinessProfile]);

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
        variant: "success",
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

  // Estadísticas rápidas
  const totalProducts = products.length;
  const totalValue = products.reduce((acc, p) => acc + (p.selling_price * p.quantity), 0);
  const lowStockProducts = products.filter(p => p.quantity < 5).length;

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader
          title="Inventory"
          description="Add and manage products in your inventory with quick tools."
        >
          {/* Botón de entrada rápida en el header */}
          <QuickAddProductModal 
            onProductAdded={fetchProducts}
            businessType={businessProfile?.business_type?.toLowerCase() || 'default'}
          />
        </PageHeader>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">$</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de stock bajo */}
        {lowStockProducts > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {lowStockProducts} product{lowStockProducts !== 1 ? 's' : ''} with low stock (less than 5 units).
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Formulario tradicional - ahora más compacto */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Product (Traditional)
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
                          Total Purchase Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
                            step="0.01"
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

          {/* Tabla de productos - ahora con duplicación */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Inventory</span>
                {products.length > 0 && (
                  <Badge variant="outline">{products.length} products</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px]">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost per Unit</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <TableRow key={product.id} className={product.quantity < 5 ? "bg-orange-50" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {product.name}
                              {product.quantity < 5 && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.cost_per_unit || 0)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.selling_price)}
                          </TableCell>
                          <TableCell>
                            <span className={product.quantity < 5 ? "font-bold text-orange-600" : ""}>
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón de duplicar */}
                              <ProductDuplicateModal
                                product={product}
                                onProductAdded={fetchProducts}
                                trigger={
                                  <Button variant="ghost" size="icon" title="Duplicate Product">
                                    <Copy className="h-4 w-4 text-blue-500" />
                                  </Button>
                                }
                              />
                              
                              {/* Botón de eliminar */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteProduct(product.id)}
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex flex-col items-center gap-4">
                            <Package className="h-16 w-16 text-muted-foreground/50" />
                            <div>
                              <h3 className="font-semibold">No products in inventory</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Use the quick add button or traditional form to get started
                              </p>
                            </div>
                            <QuickAddProductModal 
                              onProductAdded={fetchProducts}
                              businessType={businessProfile?.business_type?.toLowerCase() || 'default'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tip para usuarios nuevos */}
        {products.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Quick Tip</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Use the <strong>"Agregar Rápido"</strong> button for faster product entry with templates, 
                    or the traditional form for detailed manual entry.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </ProtectedLayout>
  );
}