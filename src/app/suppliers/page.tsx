"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { Supplier } from "@/types";
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

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required."),
  productTypes: z.string().min(1, "Product types are required."),
  purchaseDays: z.string().min(1, "Purchase days are required."),
});

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>("suppliers", []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      productTypes: "",
      purchaseDays: "",
    },
  });

  function onSubmit(values: z.infer<typeof supplierSchema>) {
    const newSupplier: Supplier = {
      id: new Date().toISOString(),
      ...values,
    };
    setSuppliers([newSupplier, ...suppliers]);
    toast({
      title: "Success!",
      description: "Supplier has been added.",
    });
    form.reset();
  }
  
  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
    toast({
      title: "Supplier Deleted",
      description: "The supplier record has been removed.",
      variant: "destructive",
    })
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Supplier Management"
        description="Maintain supplier contacts, product types, and purchase days."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Bakers Co." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Types</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bread, Pastries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Days</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monday, Thursday" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Add Supplier
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[480px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Product Types</TableHead>
                    <TableHead>Purchase Days</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.productTypes}</TableCell>
                        <TableCell>{supplier.purchaseDays}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteSupplier(supplier.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        No suppliers added yet.
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
