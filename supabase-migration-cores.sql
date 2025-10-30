-- Migration: Add cores column to produtos table
-- Execute this in your Supabase SQL Editor

-- Add cores column as text array (jsonb can also be used)
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS cores text[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN produtos.cores IS 'Array of product colors in Portuguese or English';

-- Optional: Create an index for better query performance when filtering by color
CREATE INDEX IF NOT EXISTS idx_produtos_cores ON produtos USING GIN (cores);

-- Optional: Drop old cor_oficial column if exists and no longer needed
-- Uncomment the line below if you want to remove the old column
-- ALTER TABLE produtos DROP COLUMN IF EXISTS cor_oficial;
