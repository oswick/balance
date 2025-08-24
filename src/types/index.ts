// src/types/index.ts - Updated to match database schema

export interface Sale {
  id: string; 
  date: string;
  product_id: string | null; 
  product_name?: string; 
  quantity: number;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Expense {
  id: string; 
  date: string;
  category: string;
  description: string;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Product {
  id: string; 
  name: string;
  purchase_price: number; // Represents the total cost of a purchase batch
  cost_per_unit: number; // Calculated cost for a single unit
  selling_price: number;
  quantity: number;
  user_id: string;
  created_at: string;
}

export interface Purchase {
  id: string; 
  date: string;
  product_id: string; 
  product_name?: string; // from join
  quantity: number;
  total_cost: number;
  supplier_id: string; 
  supplier_name?: string; // from join
  user_id: string;
  created_at: string;
}

export interface Supplier {
  id: string; 
  name: string;
  product_types: string;
  purchase_days: string;
  user_id: string;
  created_at: string;
}
    