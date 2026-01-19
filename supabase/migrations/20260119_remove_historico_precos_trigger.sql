-- Migration: Remover trigger de historico_precos
-- Data: 2026-01-19
-- Descrição: Remove trigger e function que tentam inserir em historico_precos (tabela removida)

-- Remover possíveis triggers na tabela produtos relacionados a histórico de preços
DROP TRIGGER IF EXISTS trigger_historico_precos ON produtos;
DROP TRIGGER IF EXISTS trg_historico_precos ON produtos;
DROP TRIGGER IF EXISTS trigger_registrar_historico_preco ON produtos;
DROP TRIGGER IF EXISTS trg_registrar_historico_preco ON produtos;
DROP TRIGGER IF EXISTS trigger_update_historico_precos ON produtos;
DROP TRIGGER IF EXISTS trigger_insert_historico_precos ON produtos;
DROP TRIGGER IF EXISTS historico_precos_trigger ON produtos;

-- Remover possíveis functions relacionadas
DROP FUNCTION IF EXISTS registrar_historico_preco() CASCADE;
DROP FUNCTION IF EXISTS insert_historico_preco() CASCADE;
DROP FUNCTION IF EXISTS update_historico_preco() CASCADE;
DROP FUNCTION IF EXISTS fn_registrar_historico_preco() CASCADE;
DROP FUNCTION IF EXISTS fn_historico_precos() CASCADE;

-- Garantir que a tabela não existe (caso a migration anterior não tenha rodado)
DROP TABLE IF EXISTS historico_precos CASCADE;
