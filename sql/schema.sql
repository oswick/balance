
-- Create products table
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  purchase_price REAL NOT NULL,
  selling_price REAL NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  product_types TEXT,
  purchase_days TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  total_cost REAL NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INT NOT NULL,
  amount REAL NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own products" ON products
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own suppliers" ON suppliers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own purchases" ON purchases
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- Policies for sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sales" ON sales
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses" ON expenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- Function to record a sale and update product quantity
CREATE OR REPLACE FUNCTION record_sale(
  p_product_id BIGINT,
  p_quantity INT,
  p_amount REAL,
  p_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert the sale
  INSERT INTO sales(product_id, quantity, amount, date, user_id)
  VALUES (p_product_id, p_quantity, p_amount, p_date, p_user_id);

  -- Decrease the product quantity
  UPDATE products
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete a sale and restore product quantity
CREATE OR REPLACE FUNCTION delete_sale(
  p_sale_id BIGINT,
  p_product_id BIGINT,
  p_quantity INT
)
RETURNS VOID AS $$
BEGIN
  -- Restore the product quantity
  UPDATE products
  SET quantity = quantity + p_quantity
  WHERE id = p_product_id;

  -- Delete the sale
  DELETE FROM sales WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a purchase and update product quantity
CREATE OR REPLACE FUNCTION record_purchase(
    p_product_id BIGINT,
    p_supplier_id BIGINT,
    p_quantity INT,
    p_total_cost REAL,
    p_date TIMESTAMPTZ,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO purchases(product_id, supplier_id, quantity, total_cost, date, user_id)
    VALUES(p_product_id, p_supplier_id, p_quantity, p_total_cost, p_date, p_user_id);

    UPDATE products
    SET quantity = quantity + p_quantity
    WHERE id = p_product_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a purchase and decrease product quantity
CREATE OR REPLACE FUNCTION delete_purchase(
    p_purchase_id BIGINT,
    p_product_id BIGINT,
    p_quantity INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET quantity = quantity - p_quantity
    WHERE id = p_product_id;

    DELETE FROM purchases WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
