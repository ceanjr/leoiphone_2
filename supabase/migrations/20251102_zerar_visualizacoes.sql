-- Função para zerar visualizações de todos os produtos
-- Criado em: 2025-11-02

CREATE OR REPLACE FUNCTION zerar_visualizacoes_produtos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Zerar visualizações de todos os produtos
  UPDATE produtos
  SET visualizacoes_total = 0
  WHERE deleted_at IS NULL;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION zerar_visualizacoes_produtos() IS 'Zera as visualizações de todos os produtos ativos';
