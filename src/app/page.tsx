
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

  const kpiCards = [
    { title: "Total Revenue", icon: DollarSign, value: formatCurrency(totalSales), description: "All sales recorded" },
    { title: "Total Expenses", icon: Receipt, value: formatCurrency(totalExpenses), description: "All expenses recorded" },
    { title: "Net Profit", icon: Wallet, value: formatCurrency(profit), description: "Revenue minus expenses", isProfit: true },
    { title: "Profit Margin", icon: TrendingUp, value: totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(2)}%` : '0.00%', description: "Net profit margin" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, index) => (
             <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.isProfit && (profit >= 0 ? 'text-green-600' : 'text-destructive')}`}>
                    {card.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="col-span-1 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
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
