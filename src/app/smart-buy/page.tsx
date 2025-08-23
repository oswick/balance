"use client";

import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sale, Expense, Purchase, Product, Supplier } from "@/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSmartBuySuggestion } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function SmartBuyPage() {
  const [sales] = useLocalStorage<Sale[]>("sales", []);
  const [expenses] = useLocalStorage<Expense[]>("expenses", []);
  const [purchases] = useLocalStorage<Purchase[]>("purchases", []);
  const [products] = useLocalStorage<Product[]>("products", []);
  const [suppliers] = useLocalStorage<Supplier[]>("suppliers", []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

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
        <CardContent>
          {!hasEnoughData && (
             <Alert variant="destructive">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Not Enough Data</AlertTitle>
              <AlertDescription>
                Please add some data to all sections (Sales, Expenses, Products, Purchases, Suppliers) to generate a suggestion.
              </AlertDescription>
            </Alert>
          )}
          {suggestion && !isLoading && (
            <div className="p-6 bg-secondary rounded-lg">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
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
          <Button onClick={handleGenerateSuggestion} disabled={isLoading || !hasEnoughData}>
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
