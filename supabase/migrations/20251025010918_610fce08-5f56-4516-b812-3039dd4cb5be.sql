-- Create area table
CREATE TABLE public.area (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on area
ALTER TABLE public.area ENABLE ROW LEVEL SECURITY;

-- RLS policies for area
CREATE POLICY "Authenticated users can view areas"
ON public.area
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert areas"
ON public.area
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update areas"
ON public.area
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete areas"
ON public.area
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create award table
CREATE TABLE public.award (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on award
ALTER TABLE public.award ENABLE ROW LEVEL SECURITY;

-- RLS policies for award
CREATE POLICY "Authenticated users can view awards"
ON public.award
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert awards"
ON public.award
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update awards"
ON public.award
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete awards"
ON public.award
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at on area
CREATE TRIGGER update_area_updated_at
BEFORE UPDATE ON public.area
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on award
CREATE TRIGGER update_award_updated_at
BEFORE UPDATE ON public.award
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();