
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
import ProtectedLayout from "../layout";
import { useTranslations } from "next-intl";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  purchase_price: z.coerce.number().min(0, "Purchase price cannot be negative."),
  selling_price: z.coerce.number().min(0, "Selling price cannot be negative."),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
});

function ProductsPageContent() {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const t = useTranslations("Products");

  const fetchProducts = React.useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: t('errors.fetch'), description: error.message, variant: "destructive" });
    } else {
      setProducts(data as Product[]);
    }
  }, [supabase, user, toast, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const editForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  React.useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        name: editingProduct.name,
        purchase_price: editingProduct.purchase_price,
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

    if (error) {
       toast({ title: t('errors.update'), description: error.message, variant: "destructive" });
    } else {
      toast({
        title: t('success.updateTitle'),
        description: t('success.updateDesc'),
      });
      setEditingProduct(null);
      fetchProducts();
    }
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: t('errors.delete'), description: error.message, variant: "destructive" });
    } else {
      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDesc'),
        variant: "destructive",
      });
      fetchProducts();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const calculateUnitProfit = (product: Product) => {
      if (product.quantity > 0) {
          return product.selling_price - (product.purchase_price / product.quantity);
      }
      // If quantity is 0, profit per unit is just the selling price
      // as we can't divide by zero. Or maybe it should be 0.
      // Let's consider it selling_price for now, as it reflects potential profit.
      return product.selling_price;
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('list.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('list.name')}</TableHead>
                    <TableHead>{t('list.purchasePrice')}</TableHead>
                    <TableHead>{t('list.sellingPrice')}</TableHead>
                    <TableHead>{t('list.profit')}</TableHead>
                    <TableHead>{t('list.quantity')}</TableHead>
                    <TableHead className="text-right">{t('list.actions')}</TableHead>
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
                          {formatCurrency(product.purchase_price)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.selling_price)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(calculateUnitProfit(product))}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProduct(product)}
                            title={t('list.editTooltip')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProduct(product.id)}
                            title={t('list.deleteTooltip')}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        {t('list.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!editingProduct}
        onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editDialog.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('editDialog.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editDialog.purchasePrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editDialog.sellingPrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editDialog.quantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    {t('editDialog.cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit">{t('editDialog.submit')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function ProductsPage() {
    return (
        <ProtectedLayout>
            <ProductsPageContent />
        </ProtectedLayout>
    )
}
