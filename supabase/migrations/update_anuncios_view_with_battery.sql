-- Atualizar view v_anuncios_facebook_com_produto para incluir nivel_bateria
-- Execute este SQL no editor SQL do Supabase

-- Drop existing view
DROP VIEW IF EXISTS v_anuncios_facebook_com_produto;

-- Recreate view with battery level
CREATE VIEW v_anuncios_facebook_com_produto AS
SELECT 
  fa.id,
  fa.produto_id,
  fa.facebook_product_id,
  fa.facebook_catalog_id,
  fa.status,
  fa.status_facebook,
  fa.titulo,
  fa.descricao,
  fa.preco,
  fa.url_imagem,
  fa.disponibilidade,
  fa.condicao,
  fa.erro_mensagem,
  fa.sincronizado_em,
  fa.created_at,
  fa.updated_at,
  p.nome as produto_nome,
  p.codigo_produto,
  p.slug as produto_slug,
  p.foto_principal as produto_imagem,
  p.ativo as produto_ativo,
  p.estoque as produto_estoque,
  p.nivel_bateria as produto_nivel_bateria, -- NOVO CAMPO
  c.nome as categoria_nome
FROM facebook_anuncios fa
LEFT JOIN produtos p ON fa.produto_id = p.id
LEFT JOIN categorias c ON p.categoria_id = c.id;

-- Comentário explicativo
COMMENT ON VIEW v_anuncios_facebook_com_produto IS 
'View que combina anúncios do Facebook com informações dos produtos, incluindo nível de bateria para exibição no admin';
