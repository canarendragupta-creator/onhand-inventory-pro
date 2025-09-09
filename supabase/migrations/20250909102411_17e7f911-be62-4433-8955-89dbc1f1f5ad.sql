-- Create stock_items table
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL UNIQUE,
  current_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  last_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_receipts table
CREATE TABLE public.stock_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  quantity_received DECIMAL(10,3) NOT NULL,
  rate_per_unit DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  supplier_name TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  received_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by TEXT
);

-- Create stock_consumptions table
CREATE TABLE public.stock_consumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  quantity_used DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  purpose_activity_code TEXT NOT NULL,
  used_by TEXT NOT NULL,
  date DATE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by TEXT
);

-- Create transaction_logs table
CREATE TABLE public.transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('receipt', 'consumption')),
  reference_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  performed_by TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication is implemented)
CREATE POLICY "Allow all operations on stock_items" ON public.stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_receipts" ON public.stock_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_consumptions" ON public.stock_consumptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transaction_logs" ON public.transaction_logs FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_receipts_updated_at
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_consumptions_updated_at
  BEFORE UPDATE ON public.stock_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.stock_items (item_name, item_code, current_quantity, unit, last_rate, total_value) VALUES
('Steel Bars', 'STL001', 500.000, 'kg', 45.50, 22750.00),
('Cement Bags', 'CEM001', 200.000, 'bag', 8.75, 1750.00),
('Electrical Wire', 'ELE001', 1000.000, 'm', 2.30, 2300.00),
('Paint Buckets', 'PNT001', 50.000, 'ltr', 12.00, 600.00),
('Wooden Planks', 'WOD001', 100.000, 'pcs', 25.00, 2500.00);