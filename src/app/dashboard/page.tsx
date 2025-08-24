"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Wallet, Calendar, Package } from "lucide-react";
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
import ProtectedLayout from "../protected-layout";

export default function DashboardPage() {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesLast7Days, setSalesLast7Days] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format currency for mobile (shorter format)
  const formatCurrencyMobile = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
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
      const [expensesResponse, purchasesResponse] = await Promise.all([
        supabase.from('expenses').select('amount').eq('user_id', user.id),
        supabase.from('purchases').select('total_cost').eq('user_id', user.id)
      ]);

      if (expensesResponse.error) {
        toast({ title: "Error fetching expenses", description: expensesResponse.error.message, variant: 'destructive' });
      }
      
      if (purchasesResponse.error) {
        toast({ title: "Error fetching purchases", description: purchasesResponse.error.message, variant: 'destructive' });
      }
      
      const regularExpenses = expensesResponse.data?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
      const purchaseExpenses = purchasesResponse.data?.reduce((acc, purchase) => acc + purchase.total_cost, 0) || 0;
      
      setTotalExpenses(regularExpenses + purchaseExpenses);
    } catch (error) {
      toast({ title: "Error loading dashboard", description: "Please try refreshing the page.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const profit = totalSales - totalExpenses;

  const kpiCards = [
    { 
      title: "Total Revenue", 
      icon: DollarSign, 
      value: formatCurrency(totalSales), 
      mobileValue: formatCurrencyMobile(totalSales),
      description: "All sales recorded", 
      color: 'text-green-500', 
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    { 
      title: "Total Expenses", 
      icon: Receipt, 
      value: formatCurrency(totalExpenses), 
      mobileValue: formatCurrencyMobile(totalExpenses),
      description: "All expenses recorded", 
      color: 'text-red-500', 
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950'
    },
    { 
      title: "Net Profit", 
      icon: Wallet, 
      value: formatCurrency(profit), 
      mobileValue: formatCurrencyMobile(profit),
      description: "Revenue minus expenses", 
      isProfit: true,
      bgColor: profit >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
    },
    { 
      title: "Profit Margin", 
      icon: TrendingUp, 
      value: totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(2)}%` : '0.00%', 
      mobileValue: totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(1)}%` : '0%',
      description: "Net profit margin",
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
  ];

  // Mobile KPI Card Component
  const MobileKpiCard = ({ card, index }: { card: any, index: number }) => (
    <Card key={index} className={`${card.borderColor} ${card.bgColor} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                {card.title}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black md:hidden ${card.isProfit && profit >= 0 ? 'text-green-500' : card.isProfit && profit < 0 ? 'text-red-500' : card.color}`}>
                {card.mobileValue}
              </span>
              <span className={`text-2xl font-black hidden md:block ${card.isProfit && profit >= 0 ? 'text-green-500' : card.isProfit && profit < 0 ? 'text-red-500' : card.color}`}>
                {card.value}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {card.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Mobile Sales Item Component
  const MobileSaleItem = ({ sale }: { sale: Sale }) => (
    <div className="flex items-center py-3 border-b border-border/50 last:border-b-0">
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
        <Package className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {sale.quantity}x {sale.products?.name || sale.product_name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(parseISO(sale.date), 'MMM d')}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-green-600 text-sm">
          +{formatCurrencyMobile(sale.amount)}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-4 p-4 pt-6 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Overview of your business performance
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, index) => (
            <MobileKpiCard key={index} card={card} index={index} />
          ))}
        </div>

        {/* Charts and Recent Sales */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-7 lg:gap-4">
          {/* Sales Chart */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Sales Overview</CardTitle>
              <p className="text-xs text-muted-foreground">Last 7 days performance</p>
            </CardHeader>
            <CardContent className="pl-2 pr-4">
              <div className="h-[250px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesLast7Days} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--foreground) / 0.1)" 
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="hsl(var(--foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value > 999 ? `$${(value/1000).toFixed(0)}K` : `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                      cursor={{ fill: 'hsl(var(--accent))' }}
                      formatter={(value: any) => [formatCurrency(value), 'Sales']}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="hsl(var(--primary))" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Recent Sales</CardTitle>
              <p className="text-xs text-muted-foreground">Latest transactions</p>
            </CardHeader>
            <CardContent className="p-4">
              {recentSales.length > 0 ? (
                <div className="space-y-0">
                  {recentSales.map((sale) => (
                    <MobileSaleItem key={sale.id} sale={sale} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No recent sales</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sales will appear here once recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}