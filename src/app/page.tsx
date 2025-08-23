
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale, Expense } from "@/types";
import { DollarSign, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const fetchDashboardData = React.useCallback(async () => {
    if (!user) return;

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('amount')
      .eq('user_id', user.id);

    if (salesError) {
      toast({ title: "Error fetching sales", description: salesError.message, variant: 'destructive' });
    } else {
      setTotalSales(salesData.reduce((acc, sale) => acc + sale.amount, 0));
    }

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id);

    if (expensesError) {
      toast({ title: "Error fetching expenses", description: expensesError.message, variant: 'destructive' });
    } else {
      setTotalExpenses(expensesData.reduce((acc, expense) => acc + expense.amount, 0));
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const profit = totalSales - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                All sales recorded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                All expenses recorded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-accent-foreground' : 'text-destructive'}`}>
                {formatCurrency(profit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue minus expenses
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profit Margin
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(2)}%` : '0.00%'}
              </div>
              <p className="text-xs text-muted-foreground">
                Net profit margin
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Welcome to Balance!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is your accounting dashboard. Use the sidebar to navigate between sections for sales, expenses, products, and more. Get started by adding your first daily sale or expense!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

