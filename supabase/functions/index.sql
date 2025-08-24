
-- Add the new column to the sales table if it doesn't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Function to record a purchase (handles both inventory and ad-hoc new products)
CREATE OR REPLACE FUNCTION record_purchase(
  p_product_id uuid,
  p_supplier_id uuid,
  p_quantity integer,
  p_total_cost numeric,
  p_date timestamptz,
  p_user_id uuid,
  p_product_name text, -- For creating new products
  p_selling_price numeric -- For creating new products
) RETURNS void AS $$
DECLARE
  new_product_id uuid;
BEGIN
  -- Check if user owns the supplier
  IF NOT EXISTS (
    SELECT 1 FROM suppliers 
    WHERE id = p_supplier_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Supplier not found or access denied';
  END IF;

  -- Handle new product creation (ad-hoc purchase)
  IF p_product_id IS NULL THEN
    -- A name and selling price must be provided for new products
    IF p_product_name IS NULL OR p_selling_price IS NULL THEN
      RAISE EXCEPTION 'Product name and selling price are required for new products.';
    END IF;

    -- Insert the new product
    INSERT INTO products (user_id, name, purchase_price, selling_price, quantity)
    VALUES (p_user_id, p_product_name, p_total_cost, p_selling_price, p_quantity)
    RETURNING id INTO new_product_id;
    
    -- Set the product_id for the purchase record
    p_product_id := new_product_id;

  -- Handle existing product purchase
  ELSE
    -- Check if user owns the product
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = p_product_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Product not found or access denied';
    END IF;
    
    -- Update product quantity (increase)
    UPDATE products 
    SET quantity = quantity + p_quantity
    WHERE id = p_product_id;
  END IF;
  
  -- Insert purchase record
  INSERT INTO purchases (user_id, date, product_id, supplier_id, quantity, total_cost)
  VALUES (p_user_id, p_date, p_product_id, p_supplier_id, p_quantity, p_total_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to record a sale (handles both inventory and ad-hoc products)
CREATE OR REPLACE FUNCTION record_sale(
  p_product_id uuid,
  p_quantity integer,
  p_amount numeric,
  p_date timestamptz,
  p_user_id uuid,
  p_product_name text -- For ad-hoc product names
) RETURNS void AS $$
BEGIN
  -- Handle inventory product sale
  IF p_product_id IS NOT NULL THEN
    -- Check if user owns the product
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = p_product_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Product not found or access denied';
    END IF;
    
    -- Check if enough stock is available
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = p_product_id AND quantity >= p_quantity
    ) THEN
      RAISE EXCEPTION 'Insufficient stock available';
    END IF;
    
    -- Update product quantity (decrease)
    UPDATE products 
    SET quantity = quantity - p_quantity
    WHERE id = p_product_id;
  END IF;
  
  -- Insert sale record (for both inventory and ad-hoc)
  INSERT INTO sales (user_id, date, product_id, quantity, amount, product_name)
  VALUES (p_user_id, p_date, p_product_id, p_quantity, p_amount, p_product_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete a sale (reverses quantity change only for inventory products)
CREATE OR REPLACE FUNCTION delete_sale(
  p_sale_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_user_id uuid,
  p_product_name text -- Not used in logic, but good practice to keep signature consistent
) RETURNS void AS $$
BEGIN
  -- Check if user owns the sale
  IF NOT EXISTS (
    SELECT 1 FROM sales 
    WHERE id = p_sale_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Sale not found or access denied';
  END IF;
  
  -- Restore product quantity only if it was an inventory sale
  IF p_product_id IS NOT NULL THEN
    UPDATE products 
    SET quantity = quantity + p_quantity
    WHERE id = p_product_id AND user_id = p_user_id;
  END IF;
  
  -- Delete sale record
  DELETE FROM sales 
  WHERE id = p_sale_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete a purchase (reverses the quantity change)
CREATE OR REPLACE FUNCTION delete_purchase(
  p_purchase_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  -- Check if user owns the purchase
  IF NOT EXISTS (
    SELECT 1 FROM purchases 
    WHERE id = p_purchase_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Purchase not found or access denied';
  END IF;
  
  -- Check if enough stock is available to remove
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = p_product_id AND quantity >= p_quantity AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot delete purchase: insufficient stock would result';
  END IF;
  
  -- Reduce product quantity (decrease)
  UPDATE products 
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id AND user_id = p_user_id;
  
  -- Delete purchase record
  DELETE FROM purchases 
  WHERE id = p_purchase_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
