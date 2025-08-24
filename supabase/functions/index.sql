-- Function to record a sale (handles both inventory and ad-hoc products)
CREATE OR REPLACE FUNCTION record_sale(
  p_product_id uuid,
  p_quantity integer,
  p_amount numeric,
  p_date timestamptz,
  p_user_id uuid,
  p_product_name text -- New parameter for ad-hoc product names
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

-- Function to record a purchase (handles new products and updates existing ones)
CREATE OR REPLACE FUNCTION record_purchase(
  p_product_id uuid,
  p_supplier_id uuid,
  p_quantity integer,
  p_total_cost numeric,
  p_date timestamptz,
  p_user_id uuid,
  p_product_name text,
  p_selling_price numeric,
  p_cost_per_unit numeric
) RETURNS void AS $$
DECLARE
  v_new_product_id uuid;
  v_current_quantity integer;
  v_current_cost_per_unit numeric;
BEGIN
  -- Check if user owns the supplier
  IF p_supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM suppliers 
    WHERE id = p_supplier_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Supplier not found or access denied';
  END IF;

  -- Handle new product creation
  IF p_product_id IS NULL THEN
    INSERT INTO products(user_id, name, selling_price, quantity, purchase_price, cost_per_unit)
    VALUES (p_user_id, p_product_name, p_selling_price, p_quantity, p_total_cost, p_cost_per_unit)
    RETURNING id INTO v_new_product_id;

    -- Insert the purchase record for the new product
    INSERT INTO purchases (user_id, date, product_id, supplier_id, quantity, total_cost)
    VALUES (p_user_id, p_date, v_new_product_id, p_supplier_id, p_quantity, p_total_cost);
  
  -- Handle purchase for an existing product
  ELSE
    -- Check if user owns the product
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = p_product_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Product not found or access denied';
    END IF;

    -- Get current state for weighted average calculation
    SELECT quantity, cost_per_unit INTO v_current_quantity, v_current_cost_per_unit
    FROM products WHERE id = p_product_id;

    -- Update product quantity and calculate new weighted average cost
    UPDATE products 
    SET 
      quantity = quantity + p_quantity,
      cost_per_unit = 
        CASE 
          WHEN (v_current_quantity + p_quantity) > 0 THEN
            ((v_current_quantity * v_current_cost_per_unit) + p_total_cost) / (v_current_quantity + p_quantity)
          ELSE
            p_cost_per_unit -- Set to new cost if old quantity was 0
        END
    WHERE id = p_product_id;
    
    -- Insert the purchase record for the existing product
    INSERT INTO purchases (user_id, date, product_id, supplier_id, quantity, total_cost)
    VALUES (p_user_id, p_date, p_product_id, p_supplier_id, p_quantity, p_total_cost);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete a sale (reverses quantity change only for inventory products)
CREATE OR REPLACE FUNCTION delete_sale(
  p_sale_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_user_id uuid,
  p_product_name text -- Maintained for consistency, not used in logic
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
  
  -- This function intentionally does not recalculate the average cost on deletion
  -- to avoid complex and potentially inaccurate historical cost adjustments.
  -- It simply removes the quantity.

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
