-- Tabelas para integração com OLX
-- Criado em: 2025-11-02
-- Descrição: Suporte para publicação automática de anúncios na OLX Brasil

-- =====================================================
-- Tabela: olx_config
-- Descrição: Configuração da integração com OLX
-- =====================================================
CREATE TABLE IF NOT EXISTS olx_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  auto_sync BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE olx_config IS 'Configuração da integração com OLX Brasil';
COMMENT ON COLUMN olx_config.client_id IS 'Client ID da aplicação OLX';
COMMENT ON COLUMN olx_config.client_secret IS 'Client Secret da aplicação OLX';
COMMENT ON COLUMN olx_config.access_token IS 'Token de acesso OAuth2 da OLX';
COMMENT ON COLUMN olx_config.refresh_token IS 'Token para renovar o access_token';
COMMENT ON COLUMN olx_config.sync_enabled IS 'Se a sincronização está ativa';
COMMENT ON COLUMN olx_config.auto_sync IS 'Se deve sincronizar automaticamente';
COMMENT ON COLUMN olx_config.sync_interval_minutes IS 'Intervalo de sincronização automática em minutos';

-- =====================================================
-- Tabela: olx_anuncios
-- Descrição: Anúncios publicados na OLX
-- =====================================================
CREATE TABLE IF NOT EXISTS olx_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  olx_ad_id TEXT UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  url_imagem TEXT,
  categoria_olx TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'anunciado', 'erro', 'pausado', 'removido')),
  erro_mensagem TEXT,
  sincronizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE olx_anuncios IS 'Anúncios publicados na OLX Brasil';
COMMENT ON COLUMN olx_anuncios.produto_id IS 'Referência ao produto do sistema';
COMMENT ON COLUMN olx_anuncios.olx_ad_id IS 'UUID do anúncio na OLX (retornado pela API)';
COMMENT ON COLUMN olx_anuncios.status IS 'Status do anúncio: pendente, anunciado, erro, pausado, removido';
COMMENT ON COLUMN olx_anuncios.erro_mensagem IS 'Mensagem de erro caso status seja erro';
COMMENT ON COLUMN olx_anuncios.sincronizado_em IS 'Última sincronização bem-sucedida com OLX';

-- =====================================================
-- Tabela: olx_sync_log
-- Descrição: Log de sincronizações com OLX
-- =====================================================
CREATE TABLE IF NOT EXISTS olx_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID REFERENCES olx_anuncios(id) ON DELETE SET NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criar', 'atualizar', 'remover', 'pausar', 'reativar')),
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro')),
  mensagem TEXT,
  request_payload JSONB,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE olx_sync_log IS 'Log de todas as operações de sincronização com OLX';
COMMENT ON COLUMN olx_sync_log.anuncio_id IS 'Referência ao anúncio (opcional)';
COMMENT ON COLUMN olx_sync_log.acao IS 'Tipo de operação: criar, atualizar, remover, pausar, reativar';
COMMENT ON COLUMN olx_sync_log.status IS 'Resultado da operação: sucesso ou erro';
COMMENT ON COLUMN olx_sync_log.request_payload IS 'Dados enviados para OLX (JSON)';
COMMENT ON COLUMN olx_sync_log.response_data IS 'Resposta da API OLX (JSON)';

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_olx_anuncios_produto ON olx_anuncios(produto_id);
CREATE INDEX IF NOT EXISTS idx_olx_anuncios_status ON olx_anuncios(status);
CREATE INDEX IF NOT EXISTS idx_olx_anuncios_olx_ad_id ON olx_anuncios(olx_ad_id);
CREATE INDEX IF NOT EXISTS idx_olx_sync_log_anuncio ON olx_sync_log(anuncio_id);
CREATE INDEX IF NOT EXISTS idx_olx_sync_log_created ON olx_sync_log(created_at DESC);

-- =====================================================
-- Trigger para atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_olx_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER olx_config_updated_at
  BEFORE UPDATE ON olx_config
  FOR EACH ROW
  EXECUTE FUNCTION update_olx_updated_at();

CREATE TRIGGER olx_anuncios_updated_at
  BEFORE UPDATE ON olx_anuncios
  FOR EACH ROW
  EXECUTE FUNCTION update_olx_updated_at();

-- =====================================================
-- View: v_olx_anuncios_com_produto
-- Descrição: View com anúncios OLX + dados do produto
-- =====================================================
CREATE OR REPLACE VIEW v_olx_anuncios_com_produto AS
SELECT 
  a.id,
  a.produto_id,
  a.olx_ad_id,
  a.titulo,
  a.descricao,
  a.preco,
  a.url_imagem,
  a.categoria_olx,
  a.status,
  a.erro_mensagem,
  a.sincronizado_em,
  a.created_at,
  a.updated_at,
  -- Dados do produto
  p.nome AS produto_nome,
  p.codigo_produto,
  p.slug AS produto_slug,
  p.foto_principal AS produto_imagem,
  p.ativo AS produto_ativo,
  p.estoque AS produto_estoque,
  p.nivel_bateria AS produto_nivel_bateria,
  c.nome AS categoria_nome
FROM 
  olx_anuncios a
  INNER JOIN produtos p ON a.produto_id = p.id
  LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE 
  p.deleted_at IS NULL;

COMMENT ON VIEW v_olx_anuncios_com_produto IS 'View que junta anúncios OLX com dados dos produtos';

-- =====================================================
-- RLS (Row Level Security) - Opcional
-- Descomente se quiser ativar RLS
-- =====================================================
-- ALTER TABLE olx_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE olx_anuncios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE olx_sync_log ENABLE ROW LEVEL SECURITY;

-- Permitir acesso apenas para usuários autenticados
-- CREATE POLICY "Acesso olx_config" ON olx_config FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Acesso olx_anuncios" ON olx_anuncios FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Acesso olx_sync_log" ON olx_sync_log FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- Dados iniciais (opcional)
-- =====================================================
-- Inserir configuração inicial desabilitada
-- INSERT INTO olx_config (client_id, client_secret, access_token, sync_enabled)
-- VALUES ('', '', '', false)
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANTS (ajustar conforme necessário)
-- =====================================================
-- Se usar service_role ou anon role, ajuste aqui
-- GRANT ALL ON olx_config TO service_role;
-- GRANT ALL ON olx_anuncios TO service_role;
-- GRANT ALL ON olx_sync_log TO service_role;
