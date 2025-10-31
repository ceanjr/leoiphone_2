-- Migration: Criar tabela produtos_custos
-- Criada em: 2025-01-31
-- Descrição: Adiciona suporte para múltiplos custos e estoques por produto

-- Criar tabela produtos_custos
CREATE TABLE IF NOT EXISTS produtos_custos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  custo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  codigo VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance nas queries
CREATE INDEX idx_produtos_custos_produto_id ON produtos_custos(produto_id);

-- Criar índice para busca por código
CREATE INDEX idx_produtos_custos_codigo ON produtos_custos(codigo) WHERE codigo IS NOT NULL;

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_produtos_custos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produtos_custos_updated_at
  BEFORE UPDATE ON produtos_custos
  FOR EACH ROW
  EXECUTE FUNCTION update_produtos_custos_updated_at();

-- Comentários para documentação
COMMENT ON TABLE produtos_custos IS 'Armazena múltiplos custos e estoques para cada produto';
COMMENT ON COLUMN produtos_custos.produto_id IS 'Referência ao produto na tabela produtos';
COMMENT ON COLUMN produtos_custos.custo IS 'Preço de custo do produto (em reais)';
COMMENT ON COLUMN produtos_custos.estoque IS 'Quantidade em estoque dessa variação de custo';
COMMENT ON COLUMN produtos_custos.codigo IS 'Código opcional para identificar a variação (ex: últimos 4 dígitos do IMEI para iPhones seminovos)';
