-- Migration: Limpeza de tabelas não utilizadas
-- Data: 2026-01-15
-- Descrição: Remove tabelas OLX, Facebook, tracking e seções que não estão em uso no código

-- =====================================================
-- PARTE 1: Remover tabelas e views OLX
-- =====================================================

-- View primeiro (depende das tabelas)
DROP VIEW IF EXISTS v_olx_anuncios_com_produto CASCADE;

-- Triggers e functions
DROP TRIGGER IF EXISTS olx_config_updated_at ON olx_config;
DROP TRIGGER IF EXISTS olx_anuncios_updated_at ON olx_anuncios;
DROP FUNCTION IF EXISTS update_olx_updated_at() CASCADE;

-- Tabelas (em ordem de dependência)
DROP TABLE IF EXISTS olx_sync_log CASCADE;
DROP TABLE IF EXISTS olx_anuncios CASCADE;
DROP TABLE IF EXISTS olx_config CASCADE;

-- =====================================================
-- PARTE 2: Remover tabelas Facebook
-- =====================================================

DROP TABLE IF EXISTS facebook_sync_log CASCADE;
DROP TABLE IF EXISTS facebook_anuncios CASCADE;

-- =====================================================
-- PARTE 3: Remover tabelas de tracking não utilizadas
-- =====================================================

-- View de estatísticas de cliques
DROP VIEW IF EXISTS banner_produtos_clicks_stats CASCADE;

-- Function de rastreamento
DROP FUNCTION IF EXISTS track_banner_produto_click(UUID, UUID, TEXT) CASCADE;

-- Tabela de cliques em banners (0 registros, não usada no código)
DROP TABLE IF EXISTS banner_produto_clicks CASCADE;

-- Tabela de conversões WhatsApp (43 registros, mas usuário quer remover)
DROP TABLE IF EXISTS conversions CASCADE;

-- =====================================================
-- PARTE 4: Remover tabelas de seções da home (não utilizadas)
-- =====================================================

-- produtos_secoes tem 0 registros e só é usada em 1 arquivo
-- secoes_home tem 3 registros mas não tem admin para gerenciar
-- A funcionalidade foi substituída por banners com produtos_destaque

DROP TABLE IF EXISTS produtos_secoes CASCADE;
DROP TABLE IF EXISTS secoes_home CASCADE;

-- =====================================================
-- PARTE 5: Remover tabelas legadas de produtos em destaque
-- (Já existe migration 20260115_cleanup_produtos_destaque_legacy.sql)
-- Adicionando aqui para garantir remoção completa
-- =====================================================

DROP FUNCTION IF EXISTS atualizar_categoria_produto_destaque() CASCADE;
DROP VIEW IF EXISTS v_produtos_destaque CASCADE;
DROP VIEW IF EXISTS v_produtos_destaque_com_categoria CASCADE;
DROP TABLE IF EXISTS produtos_destaque CASCADE;
DROP TABLE IF EXISTS categoria_produtos_relacionados CASCADE;
DROP TABLE IF EXISTS config_produtos_relacionados CASCADE;

-- Remover categoria virtual "Produtos em Destaque" se existir
DELETE FROM categorias WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- PARTE 6: Remover tabela historico_precos (não utilizada)
-- =====================================================

-- A tabela tem 152 registros mas não é usada em nenhum lugar do código
DROP TABLE IF EXISTS historico_precos CASCADE;

-- =====================================================
-- PARTE 7: Habilitar RLS nas tabelas sensíveis
-- =====================================================

-- Proteger configuracoes_taxas
ALTER TABLE configuracoes_taxas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público de leitura às taxas" ON configuracoes_taxas;
CREATE POLICY "Acesso público de leitura às taxas" ON configuracoes_taxas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas autenticados podem modificar taxas" ON configuracoes_taxas;
CREATE POLICY "Apenas autenticados podem modificar taxas" ON configuracoes_taxas
  FOR ALL USING (auth.role() = 'authenticated');

-- Proteger presets_taxas
ALTER TABLE presets_taxas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público de leitura aos presets" ON presets_taxas;
CREATE POLICY "Acesso público de leitura aos presets" ON presets_taxas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas autenticados podem modificar presets" ON presets_taxas;
CREATE POLICY "Apenas autenticados podem modificar presets" ON presets_taxas
  FOR ALL USING (auth.role() = 'authenticated');

-- Proteger produtos_custos (dados sensíveis de custo)
ALTER TABLE produtos_custos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas autenticados podem ver custos" ON produtos_custos;
CREATE POLICY "Apenas autenticados podem ver custos" ON produtos_custos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Apenas autenticados podem modificar custos" ON produtos_custos;
CREATE POLICY "Apenas autenticados podem modificar custos" ON produtos_custos
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- Comentário final
-- =====================================================
-- Tabelas REMOVIDAS nesta migration:
-- 1. olx_config, olx_anuncios, olx_sync_log + view
-- 2. facebook_anuncios, facebook_sync_log
-- 3. banner_produto_clicks + view + function
-- 4. conversions
-- 5. secoes_home, produtos_secoes
-- 6. produtos_destaque, categoria_produtos_relacionados, config_produtos_relacionados + views + functions
-- 7. historico_precos
--
-- Tabelas MANTIDAS (com RLS habilitado):
-- - produtos (core)
-- - categorias (core)
-- - banners (core)
-- - configuracoes_taxas (calculadora) - RLS habilitado
-- - presets_taxas (calculadora) - RLS habilitado
-- - produtos_custos (estoque) - RLS habilitado
-- - site_metrics (analytics)
-- - active_sessions (tracking sessões)
-- - page_views (tracking visualizações)
