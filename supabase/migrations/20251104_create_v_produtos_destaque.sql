-- Criar view v_produtos_destaque para listagem simplificada
-- Esta view será usada pela função listarProdutosEmDestaque()

CREATE OR REPLACE VIEW v_produtos_destaque AS
SELECT 
  pd.id,
  pd.produto_id,
  pd.ordem,
  pd.desconto_percentual,
  pd.ativo,
  pd.created_at,
  pd.updated_at,
  p.codigo_produto,
  p.nome as produto_nome,
  p.slug as produto_slug,
  p.preco as produto_preco,
  p.foto_principal,
  p.nivel_bateria,
  p.categoria_id
FROM produtos_destaque pd
INNER JOIN produtos p ON p.id = pd.produto_id
WHERE pd.ativo = true
  AND p.ativo = true
  AND p.deleted_at IS NULL
ORDER BY pd.ordem ASC;

COMMENT ON VIEW v_produtos_destaque IS 'Lista simplificada de produtos em destaque com informações básicas do produto';
