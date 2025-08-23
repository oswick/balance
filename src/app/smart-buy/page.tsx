
"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Loader2 } from "lucide-react";

import { Sale, Expense, Purchase, Product, Supplier } from "@/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSmartBuySuggestion } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";


export default function SmartBuyPage() {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);

    try {
      const [salesRes, expensesRes, purchasesRes, productsRes, suppliersRes] = await Promise.all([
        supabase.from('sales').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('purchases').select('*').eq('user_id', user.id),
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('suppliers').select('*').eq('user_id', user.id)
      ]);

      if (salesRes.error) throw salesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      
      setSales(salesRes.data as Sale[]);
      setExpenses(expensesRes.data as Expense[]);
      setPurchases(purchasesRes.data as Purchase[]);
      setProducts(productsRes.data as Product[]);
      setSuppliers(suppliersRes.data as Supplier[]);

    } catch (error: any) {
      toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasEnoughData = sales.length > 0 && expenses.length > 0 && purchases.length > 0 && products.length > 0 && suppliers.length > 0;

  const handleGenerateSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);

    const input = {
      dailySales: JSON.stringify(sales),
      expenses: JSON.stringify(expenses),
      productPurchases: JSON.stringify(purchases),
      productCatalog: JSON.stringify(products),
      supplierInfo: JSON.stringify(suppliers),
    };

    const result = await getSmartBuySuggestion(input);
    setSuggestion(result.suggestion);
    setIsLoading(false);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Smart Buy Suggestions"
        description="AI-driven advice on when and what to buy to maximize profitability."
      />
      <Card>
        <CardHeader>
          <CardTitle>Generate New Suggestion</CardTitle>
          <CardDescription>
            This tool analyzes your sales, expenses, product and supplier data to provide suggestions on optimal purchasing strategies.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[150px]">
          {isDataLoading && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {!isDataLoading && !hasEnoughData && (
             <Alert variant="destructive">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Not Enough Data</AlertTitle>
              <AlertDescription>
                Please add some data to all sections (Sales, Expenses, Products, Purchases, Suppliers) to generate a suggestion.
              </AlertDescription>
            </Alert>
          )}
          {suggestion && !isLoading && (
            <div className="p-6 bg-secondary">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-none">
                        <Lightbulb className="h-6 w-6 text-primary"/>
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="font-semibold">Here is your suggestion:</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{suggestion}</p>
                    </div>
                </div>
            </div>
          )}
          {isLoading && (
             <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateSuggestion} disabled={isLoading || isDataLoading || !hasEnoughData}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Suggestion"
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

