-- Migration: Create configuracoes_taxas table
-- Execute this in your Supabase SQL Editor

-- Create table for installment fee configurations
CREATE TABLE IF NOT EXISTS configuracoes_taxas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo BOOLEAN NOT NULL DEFAULT false,
  taxas JSONB NOT NULL DEFAULT '{"1x": 0.00, "2x": 1.60, "3x": 2.50, "4x": 3.30, "5x": 4.10, "6x": 4.90, "7x": 5.80, "8x": 6.70, "9x": 7.60, "10x": 8.50, "11x": 9.40, "12x": 10.30, "13x": 12.10, "14x": 13.00, "15x": 13.90, "16x": 14.80, "17x": 15.70, "18x": 16.60}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comment to document the table
COMMENT ON TABLE configuracoes_taxas IS 'Configurações de taxas de parcelamento para o site';
COMMENT ON COLUMN configuracoes_taxas.ativo IS 'Define se a calculadora de parcelas está ativa no site público';
COMMENT ON COLUMN configuracoes_taxas.taxas IS 'JSON com taxas por parcela. Ex: {"1x": 0.00, "2x": 1.60, ...}';

-- Enable RLS
ALTER TABLE configuracoes_taxas ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read (for public frontend)
CREATE POLICY "Permitir leitura pública"
  ON configuracoes_taxas
  FOR SELECT
  USING (true);

-- Policy: Only admins can modify
-- Note: Adjust this based on your admin authentication system
-- This assumes you have an admin check function or admin_users table
CREATE POLICY "Apenas admins podem modificar"
  ON configuracoes_taxas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Index for performance on active status lookups
CREATE INDEX IF NOT EXISTS idx_configuracoes_taxas_ativo
  ON configuracoes_taxas(ativo);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER update_configuracoes_taxas_updated_at
  BEFORE UPDATE ON configuracoes_taxas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration (only if table is empty)
INSERT INTO configuracoes_taxas (ativo, taxas)
SELECT false, '{"1x": 0.00, "2x": 1.60, "3x": 2.50, "4x": 3.30, "5x": 4.10, "6x": 4.90, "7x": 5.80, "8x": 6.70, "9x": 7.60, "10x": 8.50, "11x": 9.40, "12x": 10.30, "13x": 12.10, "14x": 13.00, "15x": 13.90, "16x": 14.80, "17x": 15.70, "18x": 16.60}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracoes_taxas);

-- Verify the table was created successfully
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'configuracoes_taxas'
ORDER BY ordinal_position;
