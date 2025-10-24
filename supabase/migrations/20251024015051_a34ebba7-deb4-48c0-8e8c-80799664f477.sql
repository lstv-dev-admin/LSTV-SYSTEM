-- Add is_active field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for faster queries on active users
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Add RLS policy for admins to update user active status
CREATE POLICY "Admins can update user active status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add RLS policy to prevent deactivated users from logging in by checking access
CREATE POLICY "Only active users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  CASE 
    WHEN auth.uid() = id THEN is_active = true
    ELSE true
  END
);