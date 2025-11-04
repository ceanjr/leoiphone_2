-- Migration: Remover foreign key constraint de categoria_produtos_relacionados
-- Isso permite usar produto_id como categoria_id para produtos em destaque
-- Mantendo compatibilidade com categorias normais

-- 1. Remover a constraint existente
ALTER TABLE categoria_produtos_relacionados 
DROP CONSTRAINT IF EXISTS categoria_produtos_relacionados_categoria_id_fkey;

-- 2. Renomear a coluna para refletir melhor seu uso
-- (opcional - comentado para não quebrar código existente)
-- ALTER TABLE categoria_produtos_relacionados 
-- RENAME COLUMN categoria_id TO referencia_id;

-- 3. Adicionar comentário explicativo
COMMENT ON COLUMN categoria_produtos_relacionados.categoria_id IS 
'ID de referência - pode ser categoria_id (para produtos normais) ou produto_id (para produtos em destaque com config individual)';

-- 4. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_categoria_produtos_relacionados_lookup 
ON categoria_produtos_relacionados(categoria_id);

-- 5. Adicionar constraint de validação para garantir que o ID existe em alguma das tabelas
-- (opcional - pode causar lentidão em grandes volumes)
-- ALTER TABLE categoria_produtos_relacionados
-- ADD CONSTRAINT valid_referencia_id CHECK (
--   EXISTS (SELECT 1 FROM categorias WHERE id = categoria_id) OR
--   EXISTS (SELECT 1 FROM produtos WHERE id = categoria_id)
-- );
