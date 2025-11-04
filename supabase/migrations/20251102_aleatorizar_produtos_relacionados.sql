-- Adicionar campo para persistir a ordem aleatória dos produtos relacionados
-- Criado em: 2025-11-02

-- Adicionar campo ordem_aleatoria na tabela de configuração
ALTER TABLE config_produtos_relacionados
ADD COLUMN IF NOT EXISTS ordem_aleatoria INTEGER DEFAULT 0;

-- Comentário
COMMENT ON COLUMN config_produtos_relacionados.ordem_aleatoria IS 'Seed para gerar ordem aleatória consistente dos produtos relacionados';

-- Função para aleatorizar produtos relacionados
CREATE OR REPLACE FUNCTION aleatorizar_produtos_relacionados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementar o valor da ordem aleatória para forçar nova aleatorização
  UPDATE config_produtos_relacionados
  SET ordem_aleatoria = ordem_aleatoria + 1,
      updated_at = NOW();
      
  -- Se não existir configuração, criar uma
  IF NOT FOUND THEN
    INSERT INTO config_produtos_relacionados (ativo, desconto_min, desconto_max, ordem_aleatoria)
    VALUES (true, 3.0, 7.0, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION aleatorizar_produtos_relacionados() IS 'Aleatoriza a ordem dos produtos relacionados em todo o sistema';
