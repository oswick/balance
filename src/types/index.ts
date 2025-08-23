
// src/types/index.ts - Updated to match database schema

export interface Sale {
  id: string; // Changed from number to string (UUID)
  date: string;
  product_id: string; // Changed from number to string (UUID)
  product_name?: string; // This might come from a join
  quantity: number;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Expense {
  id: string; // Changed from number to string (UUID)
  date: string;
  category: string;
  description: string;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Product {
  id: string; // Changed from number to string (UUID)
  name: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  user_id: string;
  created_at: string;
}

export interface Purchase {
  id: string; // Changed from number to string (UUID)
  date: string;
  product_id: string; // Changed from number to string (UUID)
  product_name?: string; // from join
  quantity: number;
  total_cost: number;
  supplier_id: string; // Changed from number to string (UUID)
  supplier_name?: string; // from join
  user_id: string;
  created_at: string;
}

export interface Supplier {
  id: string; // Changed from number to string (UUID)
  name: string;
  product_types: string;
  purchase_days: string;
  user_id: string;
  created_at: string;
}
