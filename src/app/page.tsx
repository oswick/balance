"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sale, Expense } from "@/types";
import { DollarSign, Receipt, TrendingUp, Wallet } from "lucide-react";

export default function Home() {
  const [sales] = useLocalStorage<Sale[]>("sales", []);
  const [expenses] = useLocalStorage<Expense[]>("expenses", []);

  const totalSales = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
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
            <CardTitle>Welcome to BizBalance!</CardTitle>
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
