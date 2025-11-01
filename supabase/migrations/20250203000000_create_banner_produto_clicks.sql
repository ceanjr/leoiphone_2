-- Migration: Criar tracking de cliques em banners de produtos em destaque
-- Data: 2025-02-03
-- Descrição: Adiciona tabela de eventos, visão agregada e RPC para registrar cliques

-- Garantir limpeza caso a migration seja reaplicada durante desenvolvimento
DROP VIEW IF EXISTS banner_produtos_clicks_stats;
DROP FUNCTION IF EXISTS record_banner_click(UUID, UUID, TEXT);

-- Criar tabela para registrar cliques
CREATE TABLE IF NOT EXISTS banner_produto_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para acelerar consultas e agregações
CREATE INDEX IF NOT EXISTS idx_banner_produto_clicks_banner_id ON banner_produto_clicks(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_produto_clicks_produto_id ON banner_produto_clicks(produto_id);
CREATE INDEX IF NOT EXISTS idx_banner_produto_clicks_created_at ON banner_produto_clicks(created_at);

-- Habilitar RLS e liberar inserções pelo app público
ALTER TABLE banner_produto_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon pode inserir cliques" ON banner_produto_clicks;
CREATE POLICY "anon pode inserir cliques" ON banner_produto_clicks
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "service role total" ON banner_produto_clicks;
CREATE POLICY "service role total" ON banner_produto_clicks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON banner_produto_clicks TO authenticated;
GRANT SELECT ON banner_produto_clicks TO service_role;
GRANT INSERT ON banner_produto_clicks TO anon;
GRANT INSERT ON banner_produto_clicks TO authenticated;

-- Visão agregada por banner/produto
CREATE VIEW banner_produtos_clicks_stats AS
SELECT
  bpc.banner_id,
  bpc.produto_id,
  COUNT(*)::BIGINT AS total_clicks,
  COUNT(DISTINCT bpc.visitor_id)::BIGINT AS unique_visitors,
  MIN(bpc.created_at) AS first_click_at,
  MAX(bpc.created_at) AS last_click_at
FROM banner_produto_clicks bpc
GROUP BY bpc.banner_id, bpc.produto_id;

GRANT SELECT ON banner_produtos_clicks_stats TO authenticated;
GRANT SELECT ON banner_produtos_clicks_stats TO service_role;

-- RPC para registrar cliques do frontend
CREATE OR REPLACE FUNCTION record_banner_click(
  p_banner_id UUID,
  p_produto_id UUID,
  p_visitor_id TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO banner_produto_clicks (banner_id, produto_id, visitor_id)
  VALUES (p_banner_id, p_produto_id, p_visitor_id);
END;
$$;

GRANT EXECUTE ON FUNCTION record_banner_click(UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_banner_click(UUID, UUID, TEXT) TO authenticated;

COMMENT ON TABLE banner_produto_clicks IS 'Eventos de cliques em banners do tipo produtos_destaque';
COMMENT ON VIEW banner_produtos_clicks_stats IS 'Resumo de cliques (total e únicos) por banner/produto';
COMMENT ON FUNCTION record_banner_click(UUID, UUID, TEXT) IS 'Registra cliques em produtos exibidos nos banners de destaque';
