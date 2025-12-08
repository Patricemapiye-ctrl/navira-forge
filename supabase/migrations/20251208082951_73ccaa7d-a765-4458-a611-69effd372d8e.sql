-- Add working hours columns to company_info table
ALTER TABLE public.company_info 
ADD COLUMN weekday_hours TEXT DEFAULT '8:00 AM - 6:00 PM',
ADD COLUMN saturday_hours TEXT DEFAULT '8:00 AM - 4:00 PM',
ADD COLUMN sunday_hours TEXT DEFAULT 'Closed';