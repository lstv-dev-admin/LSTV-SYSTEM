-- Add parent_id column to support hierarchical menu structure
ALTER TABLE menu_items ADD COLUMN parent_id uuid REFERENCES menu_items(id) ON DELETE CASCADE;

-- Update Area and Award to be children of Masterfile
-- First, get the Masterfile ID and update its children
UPDATE menu_items 
SET parent_id = (SELECT id FROM menu_items WHERE title = 'Masterfile' LIMIT 1)
WHERE title IN ('Area', 'Award');

-- Update General Setup path if needed
UPDATE menu_items 
SET path = '/general-setup'
WHERE title = 'General Setup';