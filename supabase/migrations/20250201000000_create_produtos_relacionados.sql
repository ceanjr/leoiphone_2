-- Migration: Criar sistema de produtos relacionados
-- Criada em: 2025-02-01
-- Descrição: Adiciona tabelas para gerenciar produtos relacionados por categoria

-- Tabela de configurações de produtos relacionados por categoria
CREATE TABLE IF NOT EXISTS categoria_produtos_relacionados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  auto_select BOOLEAN NOT NULL DEFAULT true,
  produtos_selecionados UUID[] DEFAULT '{}',
  desconto_percentual DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (desconto_percentual >= 0 AND desconto_percentual <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria_id)
);

-- Índice para melhorar performance nas queries
CREATE INDEX idx_categoria_produtos_relacionados_categoria_id ON categoria_produtos_relacionados(categoria_id);

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_categoria_produtos_relacionados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categoria_produtos_relacionados_updated_at
  BEFORE UPDATE ON categoria_produtos_relacionados
  FOR EACH ROW
  EXECUTE FUNCTION update_categoria_produtos_relacionados_updated_at();

-- Comentários para documentação
COMMENT ON TABLE categoria_produtos_relacionados IS 'Configurações de produtos relacionados para cada categoria';
COMMENT ON COLUMN categoria_produtos_relacionados.categoria_id IS 'Referência à categoria';
COMMENT ON COLUMN categoria_produtos_relacionados.auto_select IS 'Se true, usa seleção automática inteligente. Se false, prioriza produtos_selecionados';
COMMENT ON COLUMN categoria_produtos_relacionados.produtos_selecionados IS 'Array de UUIDs de produtos manualmente selecionados';
COMMENT ON COLUMN categoria_produtos_relacionados.desconto_percentual IS 'Percentual de desconto a ser aplicado nos produtos relacionados';

-- Inserir configurações padrão para categorias existentes
INSERT INTO categoria_produtos_relacionados (categoria_id, auto_select, desconto_percentual)
SELECT id, true, 5.00
FROM categorias
ON CONFLICT (categoria_id) DO NOTHING;
