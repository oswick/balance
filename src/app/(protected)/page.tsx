"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
  } from 'recharts';
import { subDays, format, parseISO } from 'date-fns';
import type { Sale } from "@/types";

export default function Home() {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesLast7Days, setSalesLast7Days] = useState<any[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    // Fetch Sales
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*, products(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (salesError) {
      toast({ title: "Error fetching sales", description: salesError.message, variant: 'destructive' });
    } else {
      setTotalSales(salesData.reduce((acc, sale) => acc + sale.amount, 0));
      setRecentSales(salesData.slice(0, 5));

      const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i));
      const dailySales = last7Days.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const total = salesData
          .filter(sale => format(parseISO(sale.date), 'yyyy-MM-dd') === dateString)
          .reduce((sum, sale) => sum + sale.amount, 0);
        return { name: format(day, 'MMM d'), total };
      }).reverse();
      setSalesLast7Days(dailySales);
    }

    // Fetch Expenses and Purchases
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id);

    if (expensesError) {
      toast({ title: "Error fetching expenses", description: expensesError.message, variant: 'destructive' });
    }
    
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('total_cost')
      .eq('user_id', user.id);

    if (purchasesError) {
        toast({ title: "Error fetching purchases", description: purchasesError.message, variant: 'destructive' });
    }
    
    const regularExpenses = expensesData?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
    const purchaseExpenses = purchasesData?.reduce((acc, purchase) => acc + purchase.total_cost, 0) || 0;
    
    setTotalExpenses(regularExpenses + purchaseExpenses);

  }, [supabase, user, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const profit = totalSales - totalExpenses;

  const kpiCards = [
    { title: "Total Revenue", icon: DollarSign, value: formatCurrency(totalSales), description: "All sales recorded", color: 'text-green-500', borderColor: 'border-green-500' },
    { title: "Total Expenses", icon: Receipt, value: formatCurrency(totalExpenses), description: "All expenses recorded", color: 'text-red-500', borderColor: 'border-red-500' },
    { title: "Net Profit", icon: Wallet, value: formatCurrency(profit), description: "Revenue minus expenses", isProfit: true },
    { title: "Profit Margin", icon: TrendingUp, value: totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(2)}%` : '0.00%', description: "Net profit margin" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, index) => (
             <Card key={index} className={card.borderColor}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-black ${card.isProfit && profit >= 0 ? 'text-green-500' : card.isProfit && profit < 0 ? 'text-red-500' : card.color}`}>
                    {card.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.2)" />
                    <XAxis
                        dataKey="name"
                        stroke="hsl(var(--foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="hsl(var(--foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "2px solid hsl(var(--border))",
                        boxShadow: "4px 4px 0 hsl(var(--brutal-black))"
                        }}
                        cursor={{fill: 'hsl(var(--accent))'}}
                    />
                    <Bar dataKey="total" fill="hsl(var(--brutal-black))" radius={0} />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center">
                        <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {sale.quantity}x {sale.product_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {format(parseISO(sale.date), 'MMMM d, yyyy')}
                        </p>
                        </div>
                        <div className="ml-auto font-medium text-green-500">
                        +{formatCurrency(sale.amount)}
                        </div>
                    </div>
                    ))}
                    {recentSales.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent sales</p>
                    )}
                </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}