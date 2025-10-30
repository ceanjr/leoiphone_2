-- Migration: Create configuracoes_taxas table (SEM RLS - Mais Simples)
-- Execute this in your Supabase SQL Editor
-- ⚠️ ATENÇÃO: Esta versão NÃO usa RLS. Use apenas se as rotas /admin/* já estão protegidas.

-- Create table for installment fee configurations
CREATE TABLE IF NOT EXISTS configuracoes_taxas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo BOOLEAN NOT NULL DEFAULT false,
  taxas JSONB NOT NULL DEFAULT '{"1x": 0.00, "2x": 1.60, "3x": 2.50, "4x": 3.30, "5x": 4.10, "6x": 4.90, "7x": 5.80, "8x": 6.70, "9x": 7.60, "10x": 8.50, "11x": 9.40, "12x": 10.30, "13x": 12.10, "14x": 13.00, "15x": 13.90, "16x": 14.80, "17x": 15.70, "18x": 16.60}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comments
COMMENT ON TABLE configuracoes_taxas IS 'Configurações de taxas de parcelamento para o site';
COMMENT ON COLUMN configuracoes_taxas.ativo IS 'Define se a calculadora de parcelas está ativa no site público';
COMMENT ON COLUMN configuracoes_taxas.taxas IS 'JSON com taxas por parcela. Ex: {"1x": 0.00, "2x": 1.60, ...}';

-- DESABILITAR RLS (mais simples, mas menos seguro)
ALTER TABLE configuracoes_taxas DISABLE ROW LEVEL SECURITY;

-- Index for performance
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

-- Trigger
DROP TRIGGER IF EXISTS update_configuracoes_taxas_updated_at ON configuracoes_taxas;
CREATE TRIGGER update_configuracoes_taxas_updated_at
  BEFORE UPDATE ON configuracoes_taxas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration
INSERT INTO configuracoes_taxas (ativo, taxas)
SELECT false, '{"1x": 0.00, "2x": 1.60, "3x": 2.50, "4x": 3.30, "5x": 4.10, "6x": 4.90, "7x": 5.80, "8x": 6.70, "9x": 7.60, "10x": 8.50, "11x": 9.40, "12x": 10.30, "13x": 12.10, "14x": 13.00, "15x": 13.90, "16x": 14.80, "17x": 15.70, "18x": 16.60}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracoes_taxas);

-- Verify
SELECT
  'configuracoes_taxas' as table_name,
  'Tabela criada com sucesso! (SEM RLS)' as status,
  COUNT(*) as registros
FROM configuracoes_taxas;
