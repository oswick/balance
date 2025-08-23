
export interface Sale {
  id: number;
  date: string;
  product_id: number;
  product_name?: string; // This might come from a join
  quantity: number;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  user_id: string;
  created_at: string;
}

export interface Purchase {
  id: number;
  date: string;
  product_id: number;
  product_name?: string; // from join
  quantity: number;
  total_cost: number;
  supplier_id: number;
  supplier_name?: string; // from join
  user_id: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  product_types: string;
  purchase_days: string;
  user_id: string;
  created_at: string;
}

