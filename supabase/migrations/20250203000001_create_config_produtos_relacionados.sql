-- Migration: Configuração global de produtos relacionados
-- Criada em: 2025-02-03
-- Descrição: Adiciona tabela para configurações globais de produtos relacionados

-- Tabela de configuração global
CREATE TABLE IF NOT EXISTS config_produtos_relacionados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo BOOLEAN NOT NULL DEFAULT true,
  desconto_global DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (desconto_global >= 0 AND desconto_global <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_config_produtos_relacionados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_config_produtos_relacionados_updated_at
  BEFORE UPDATE ON config_produtos_relacionados
  FOR EACH ROW
  EXECUTE FUNCTION update_config_produtos_relacionados_updated_at();

-- Comentários
COMMENT ON TABLE config_produtos_relacionados IS 'Configurações globais do sistema de produtos relacionados';
COMMENT ON COLUMN config_produtos_relacionados.ativo IS 'Se true, o sistema de produtos relacionados está ativo no site';
COMMENT ON COLUMN config_produtos_relacionados.desconto_global IS 'Desconto padrão a ser aplicado em todas as categorias';

-- Inserir configuração padrão (apenas uma linha deve existir)
INSERT INTO config_produtos_relacionados (ativo, desconto_global)
VALUES (true, 5.00)
ON CONFLICT DO NOTHING;
