-- Criar tabela de produtos em destaque
CREATE TABLE IF NOT EXISTS produtos_destaque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  desconto_percentual NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id)
);

-- Índices para produtos_destaque
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_produto_id ON produtos_destaque(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_ativo ON produtos_destaque(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_ordem ON produtos_destaque(ordem);

-- Comentários
COMMENT ON TABLE produtos_destaque IS 'Produtos destacados na home e outras páginas';
COMMENT ON COLUMN produtos_destaque.ordem IS 'Ordem de exibição dos produtos em destaque (menor = primeiro)';
COMMENT ON COLUMN produtos_destaque.desconto_percentual IS 'Desconto percentual aplicado ao produto quando em destaque';
COMMENT ON COLUMN produtos_destaque.ativo IS 'Se o produto está atualmente em destaque';

-- Criar categoria virtual "Produtos em Destaque"
-- Esta categoria não aparece no site, serve apenas para configuração de produtos relacionados

INSERT INTO categorias (id, nome, slug, ativo, ordem)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fixo para facilitar referência
  '🎯 Produtos em Destaque',
  'produtos-destaque-virtual',
  false, -- Inativa para não aparecer no site
  999 -- Ordem alta para ficar no final
)
ON CONFLICT (id) DO UPDATE 
SET 
  nome = EXCLUDED.nome,
  slug = EXCLUDED.slug,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem;

-- Adicionar configuração de produtos relacionados para esta categoria
INSERT INTO categoria_produtos_relacionados (categoria_id, auto_select, produtos_selecionados, desconto_min, desconto_max)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  true, -- Por padrão usa seleção automática
  ARRAY[]::uuid[], -- Array vazio de UUIDs
  3.0,
  7.0
)
ON CONFLICT (categoria_id) DO NOTHING;

-- Comentários
COMMENT ON COLUMN categorias.ativo IS 'Se false, categoria não aparece no site público. Usado para categorias virtuais como "Produtos em Destaque"';

-- Função para atualizar categoria de produtos ao virar destaque
CREATE OR REPLACE FUNCTION atualizar_categoria_produto_destaque()
RETURNS TRIGGER AS $$
DECLARE
  categoria_destaque_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Quando produto é adicionado ao destaque, atualizar sua categoria
  IF (TG_OP = 'INSERT') THEN
    UPDATE produtos 
    SET categoria_id = categoria_destaque_id
    WHERE id = NEW.produto_id;
    RETURN NEW;
  END IF;
  
  -- Quando produto é removido do destaque, aqui você pode implementar lógica
  -- para restaurar categoria original se necessário
  IF (TG_OP = 'DELETE') THEN
    -- Por enquanto não fazemos nada, mas você pode implementar
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar categoria quando produto vira destaque
DROP TRIGGER IF EXISTS trigger_atualizar_categoria_destaque ON produtos_destaque;
CREATE TRIGGER trigger_atualizar_categoria_destaque
  AFTER INSERT OR DELETE ON produtos_destaque
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_categoria_produto_destaque();

-- View para facilitar consultas de produtos em destaque
CREATE OR REPLACE VIEW v_produtos_destaque_com_categoria AS
SELECT 
  p.*,
  pd.ordem as ordem_destaque,
  pd.desconto_percentual as desconto_destaque,
  pd.ativo as ativo_destaque
FROM produtos p
INNER JOIN produtos_destaque pd ON p.id = pd.produto_id
WHERE p.categoria_id = '00000000-0000-0000-0000-000000000001'
  AND p.ativo = true
  AND p.deleted_at IS NULL
ORDER BY pd.ordem ASC;

COMMENT ON VIEW v_produtos_destaque_com_categoria IS 'Produtos que estão em destaque com suas configurações';
