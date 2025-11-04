-- Adicionar campo countdown_ends_at para banners de produtos em destaque
ALTER TABLE banners 
ADD COLUMN countdown_ends_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN banners.countdown_ends_at IS 'Data/hora limite da promoção para exibir contagem regressiva';
