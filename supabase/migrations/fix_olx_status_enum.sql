-- Fix OLX status enum to include 'processando' and 'ativo'
-- Data: 2025-11-04

-- Remove a constraint antiga
ALTER TABLE olx_anuncios 
DROP CONSTRAINT IF EXISTS olx_anuncios_status_check;

-- Adiciona a nova constraint com todos os status
ALTER TABLE olx_anuncios
ADD CONSTRAINT olx_anuncios_status_check 
CHECK (status IN ('pendente', 'processando', 'anunciado', 'ativo', 'erro', 'pausado', 'removido'));

-- Atualizar comentário
COMMENT ON COLUMN olx_anuncios.status IS 'Status do anúncio: pendente, processando, anunciado, ativo, erro, pausado, removido';
