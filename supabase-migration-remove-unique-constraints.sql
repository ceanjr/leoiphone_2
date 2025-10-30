-- Migration: Remove unique constraints from produtos table
-- Produtos podem ter campos repetidos (nome, código, slug, etc)
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover constraint de código_produto único (se existir)
ALTER TABLE produtos
DROP CONSTRAINT IF EXISTS produtos_codigo_produto_key;

-- 2. Remover constraint de slug único (se existir)
ALTER TABLE produtos
DROP CONSTRAINT IF EXISTS produtos_slug_key;

-- 3. Remover índice único de codigo_produto (se existir)
DROP INDEX IF EXISTS produtos_codigo_produto_key;

-- 4. Remover índice único de slug (se existir)
DROP INDEX IF EXISTS produtos_slug_key;

-- 5. Criar índices não-únicos para melhor performance de busca
-- (opcional, mas recomendado para queries)
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_produto ON produtos(codigo_produto) WHERE codigo_produto IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

-- Verificar constraints restantes
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'produtos'::regclass
AND contype = 'u';

-- Resultado esperado: Apenas a constraint da primary key (id) deve aparecer
