// src/types/index.ts - Updated to match database schema

export interface Sale {
  products: any;
  id: string; 
  date: string;
  product_id: string | null; 
  product_name: string | null; 
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
  purchase_price: number; 
  cost_per_unit: number; 
  selling_price: number;
  quantity: number;
  user_id: string;
  created_at: string;
}

export interface Purchase {
  id: string; 
  date: string;
  product_id: string | null; 
  product_name?: string; // from join
  quantity: number;
  total_cost: number;
  supplier_id: string | null; 
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
    
export interface BusinessProfile {
  id: string;
  user_id: string;
  name: string | null;
  business_type: string | null;
  hours: string | null;
  product_types: string | null;
  created_at: string;
}
