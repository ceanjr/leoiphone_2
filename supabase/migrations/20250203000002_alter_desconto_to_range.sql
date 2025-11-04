-- Migration: Alterar desconto para range (min/max)
-- Criada em: 2025-02-03
-- Descrição: Substitui desconto único por faixa de descontos aleatórios

-- 1. Alterar tabela de configuração global
ALTER TABLE config_produtos_relacionados
  DROP COLUMN IF EXISTS desconto_global;

ALTER TABLE config_produtos_relacionados
  ADD COLUMN desconto_min DECIMAL(5, 2) NOT NULL DEFAULT 3.00 CHECK (desconto_min >= 0 AND desconto_min <= 100),
  ADD COLUMN desconto_max DECIMAL(5, 2) NOT NULL DEFAULT 7.00 CHECK (desconto_max >= 0 AND desconto_max <= 100);

-- 2. Alterar tabela de configuração por categoria
ALTER TABLE categoria_produtos_relacionados
  DROP COLUMN IF EXISTS desconto_percentual;

ALTER TABLE categoria_produtos_relacionados
  ADD COLUMN desconto_min DECIMAL(5, 2) NOT NULL DEFAULT 3.00 CHECK (desconto_min >= 0 AND desconto_min <= 100),
  ADD COLUMN desconto_max DECIMAL(5, 2) NOT NULL DEFAULT 7.00 CHECK (desconto_max >= 0 AND desconto_max <= 100);

-- Atualizar comentários
COMMENT ON COLUMN config_produtos_relacionados.desconto_min IS 'Desconto mínimo (%) a ser aplicado nos produtos relacionados';
COMMENT ON COLUMN config_produtos_relacionados.desconto_max IS 'Desconto máximo (%) a ser aplicado nos produtos relacionados';
COMMENT ON COLUMN categoria_produtos_relacionados.desconto_min IS 'Desconto mínimo (%) a ser aplicado nos produtos relacionados desta categoria';
COMMENT ON COLUMN categoria_produtos_relacionados.desconto_max IS 'Desconto máximo (%) a ser aplicado nos produtos relacionados desta categoria';

-- Atualizar registro padrão se existir
UPDATE config_produtos_relacionados
SET desconto_min = 3.00, desconto_max = 7.00
WHERE desconto_min IS NULL OR desconto_max IS NULL;

UPDATE categoria_produtos_relacionados
SET desconto_min = 3.00, desconto_max = 7.00
WHERE desconto_min IS NULL OR desconto_max IS NULL;
