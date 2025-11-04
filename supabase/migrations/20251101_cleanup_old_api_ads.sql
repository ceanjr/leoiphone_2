-- Migration: Limpar anúncios criados com API antiga
-- Data: 2025-11-01
-- Motivo: Remover produtos da API antiga (Commerce) que não aparecem no Marketplace

-- 1. Deletar anúncios antigos (sem status_facebook ou que não estão no marketplace)
-- Nota: Isso não remove do Facebook, apenas do banco local
DELETE FROM facebook_anuncios
WHERE status = 'anunciado'
  AND (
    status_facebook IS NULL 
    OR status_facebook = ''
    OR created_at < '2025-11-01'  -- Produtos criados antes da refatoração
  );

-- 2. Limpar logs antigos relacionados à API antiga
DELETE FROM facebook_sync_log
WHERE acao IN ('criar', 'atualizar')  -- Ações da API antiga
  AND created_at < '2025-11-01';

-- 3. (OPCIONAL) Se quiser remover TODOS os anúncios e começar do zero:
-- DESCOMENTE APENAS SE TIVER CERTEZA!
-- TRUNCATE TABLE facebook_anuncios RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE facebook_sync_log RESTART IDENTITY CASCADE;

-- Verificar quantos anúncios restam
SELECT 
  status,
  status_facebook,
  COUNT(*) as total
FROM facebook_anuncios
GROUP BY status, status_facebook
ORDER BY total DESC;
