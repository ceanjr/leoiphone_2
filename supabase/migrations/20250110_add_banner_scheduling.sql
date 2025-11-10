-- Adicionar campos de agendamento para banners
-- Permite programar quando o banner deve ficar ativo/inativo

ALTER TABLE banners
ADD COLUMN active_from TIMESTAMPTZ NULL,
ADD COLUMN active_until TIMESTAMPTZ NULL;

COMMENT ON COLUMN banners.active_from IS 'Data/hora de início (o banner ficará ativo a partir deste momento)';
COMMENT ON COLUMN banners.active_until IS 'Data/hora de fim (o banner será desativado automaticamente após este momento)';

-- Índices para otimizar consultas de banners ativos
CREATE INDEX idx_banners_active_from ON banners(active_from) WHERE active_from IS NOT NULL;
CREATE INDEX idx_banners_active_until ON banners(active_until) WHERE active_until IS NOT NULL;

-- Função para desativar banners expirados automaticamente
CREATE OR REPLACE FUNCTION auto_disable_expired_banners()
RETURNS void AS $$
BEGIN
  UPDATE banners
  SET ativo = FALSE
  WHERE ativo = TRUE
  AND (
    -- Desativar se active_until já passou
    (active_until IS NOT NULL AND active_until < NOW())
    OR
    -- Desativar se countdown_ends_at já passou
    (countdown_ends_at IS NOT NULL AND countdown_ends_at < NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_disable_expired_banners() IS 'Desativa banners cujo prazo (active_until ou countdown_ends_at) já expirou';

-- Criar um trigger ou job para executar periodicamente (cron job recomendado)
-- Por enquanto, a função pode ser chamada manualmente ou via API
