
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
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

const salesSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  productId: z.string().min(1, "Please select a product."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

export default function SalesPage() {
  const [sales, setSales] = useLocalStorage<Sale[]>("sales", []);
  const [products, setProducts] = useLocalStorage<Product[]>("products", []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof salesSchema>>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: new Date(),
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof salesSchema>) {
    const product = products.find((p) => p.id === values.productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Product not found.",
        variant: "destructive",
      });
      return;
    }

    if (product.quantity < values.quantity) {
      toast({
        title: "Error",
        description: `Not enough stock for ${product.name}. Available: ${product.quantity}`,
        variant: "destructive",
      });
      return;
    }

    const newSale: Sale = {
      id: new Date().toISOString(),
      date: values.date.toISOString(),
      productId: values.productId,
      productName: product.name,
      quantity: values.quantity,
      amount: product.sellingPrice * values.quantity,
    };
    
    // Decrease product quantity
    const updatedProducts = products.map((p) =>
      p.id === values.productId
        ? { ...p, quantity: p.quantity - values.quantity }
        : p
    );
    setProducts(updatedProducts);
    
    setSales([newSale, ...sales]);

    toast({
      title: "Success!",
      description: "Daily sale has been added.",
    });
    form.reset({
      date: new Date(),
      productId: "",
      quantity: 1,
    });
  }
  
  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    // Increase product quantity back
    const updatedProducts = products.map((p) =>
      p.id === saleToDelete.productId
        ? { ...p, quantity: p.quantity + saleToDelete.quantity }
        : p
    );
    setProducts(updatedProducts);

    setSales(sales.filter(sale => sale.id !== saleId));
    toast({
      title: "Sale Deleted",
      description: "The sale record has been removed.",
      variant: "destructive",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Daily Sales"
        description="Record your total sales for each day."
      />
      <div className="grid gap-6 md:grid-cols-2">
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
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
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
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
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
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                         <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteSale(sale.id)}>
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
