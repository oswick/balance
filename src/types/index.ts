export interface Sale {
  id: string;
  date: string;
  amount: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
  supplierId: string;
  supplierName: string;
}

export interface Supplier {
  id: string;
  name: string;
  productTypes: string;
  purchaseDays: string;
}
