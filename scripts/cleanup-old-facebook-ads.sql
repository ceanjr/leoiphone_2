-- LIMPEZA COMPLETA: Remover produtos da API antiga
-- Data: 2025-11-01
-- Motivo: API antiga bloqueada - "API access blocked"

-- ⚠️  ATENÇÃO: Este script remove TODOS os anúncios existentes
-- Só execute se tiver certeza!

-- 1. Desabilitar triggers temporariamente (se houver)
-- (Apenas se você tiver triggers configurados)

-- 2. Limpar TODOS os anúncios
TRUNCATE TABLE facebook_anuncios RESTART IDENTITY CASCADE;

-- 3. Limpar TODOS os logs
TRUNCATE TABLE facebook_sync_log RESTART IDENTITY CASCADE;

-- 4. Verificar se limpou
SELECT COUNT(*) as total_anuncios FROM facebook_anuncios;
SELECT COUNT(*) as total_logs FROM facebook_sync_log;

-- ✅ Resultado esperado:
-- total_anuncios = 0
-- total_logs = 0

-- Agora você pode criar novos anúncios com a API correta (Marketplace)
