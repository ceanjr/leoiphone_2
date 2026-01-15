-- Migration: Limpeza de funcionalidades legadas de Produtos em Destaque
-- Data: 2026-01-15
-- Descrição: Remove categoria virtual, tabelas de configuração de descontos
-- e simplifica sistema de produtos relacionados

-- 1. Remover função e trigger primeiro (dependências)
DROP FUNCTION IF EXISTS atualizar_categoria_produto_destaque() CASCADE;

-- 2. Remover views (se existirem)
DROP VIEW IF EXISTS v_produtos_destaque CASCADE;
DROP VIEW IF EXISTS v_produtos_destaque_com_categoria CASCADE;

-- 3. Remover tabelas (se existirem)
DROP TABLE IF EXISTS produtos_destaque CASCADE;
DROP TABLE IF EXISTS categoria_produtos_relacionados CASCADE;
DROP TABLE IF EXISTS config_produtos_relacionados CASCADE;

-- 4. Remover categoria virtual "Produtos em Destaque" (se existir)
DELETE FROM categorias 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Comentário: Limpeza concluída. Sistema agora usa apenas:
-- - produtos_relacionados via API (lógica simplificada)
-- - banners com produtos_destaque (campo JSON com preco_promocional)
