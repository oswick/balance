"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sale } from "@/types";
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
import { useToast } from "@/hooks/use-toast";

const salesSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
});

export default function SalesPage() {
  const [sales, setSales] = useLocalStorage<Sale[]>("sales", []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof salesSchema>>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof salesSchema>) {
    const newSale: Sale = {
      id: new Date().toISOString(),
      date: values.date.toISOString(),
      amount: values.amount,
    };
    setSales([newSale, ...sales]);
    toast({
      title: "Success!",
      description: "Daily sale has been added.",
    });
    form.reset();
  }
  
  const deleteSale = (id: string) => {
    setSales(sales.filter(sale => sale.id !== id));
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Sales Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1500.00" {...field} />
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length > 0 ? (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.date), "PPP")}</TableCell>
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
                      <TableCell colSpan={3} className="text-center py-10">
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
