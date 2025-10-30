-- Migration: Tracking de page views e sessões ativas
-- Execute no SQL Editor do Supabase

-- Tabela para rastrear page views
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para rastrear sessões ativas (usuários online)
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL UNIQUE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para rastrear conversões (cliques no WhatsApp)
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  produto_id UUID,
  produto_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_visitor_id ON conversions(visitor_id);

-- RLS: Leitura pública, escrita pública (tracking anônimo)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública" ON page_views FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública" ON active_sessions FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON active_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON active_sessions FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção pública" ON active_sessions FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública" ON conversions FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON conversions FOR INSERT WITH CHECK (true);

-- Função para limpar sessões antigas (considera inativas após 5 minutos)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Função para registrar page view e atualizar sessão
CREATE OR REPLACE FUNCTION track_page_view(
  p_visitor_id TEXT,
  p_path TEXT
)
RETURNS void AS $$
BEGIN
  -- Inserir page view
  INSERT INTO page_views (visitor_id, path)
  VALUES (p_visitor_id, p_path);

  -- Atualizar ou criar sessão ativa
  INSERT INTO active_sessions (visitor_id, page_path, last_seen)
  VALUES (p_visitor_id, p_path, NOW())
  ON CONFLICT (visitor_id)
  DO UPDATE SET
    last_seen = NOW(),
    page_path = p_path;
END;
$$ LANGUAGE plpgsql;
