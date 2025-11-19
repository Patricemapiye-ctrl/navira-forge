-- Enable realtime for inventory table to allow real-time stock alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;