-- Cron job para resetar visualizações dos produtos toda segunda-feira
-- Criado em: 2026-01-23

-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job existente se houver (para evitar duplicatas)
SELECT cron.unschedule('reset-visualizacoes-semanal')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-visualizacoes-semanal'
);

-- Criar cron job para executar toda segunda-feira às 00:00 (horário de Brasília = 03:00 UTC)
-- Expressão cron: minuto hora dia-do-mês mês dia-da-semana
-- '0 3 * * 1' = às 03:00 UTC toda segunda-feira (dia 1 da semana)
SELECT cron.schedule(
  'reset-visualizacoes-semanal',
  '0 3 * * 1',
  $$SELECT zerar_visualizacoes_produtos()$$
);

-- Comentário do job
COMMENT ON FUNCTION zerar_visualizacoes_produtos() IS 'Zera as visualizações de todos os produtos ativos - Executado automaticamente toda segunda-feira às 00:00 (Brasília)';
