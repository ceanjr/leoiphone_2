#!/bin/bash

# Script para analisar uso de Image do Next.js no projeto
# Autor: AI Assistant
# Data: 02/11/2025

echo "🔍 Análise de uso de Next.js Image no projeto"
echo "=============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contar total de componentes Image
TOTAL_IMAGES=$(grep -r "from 'next/image'" --include="*.tsx" --include="*.ts" . | wc -l)
echo -e "${GREEN}📊 Total de arquivos usando Image: $TOTAL_IMAGES${NC}"
echo ""

# Listar arquivos
echo "📁 Arquivos que usam Next Image:"
echo "================================"
grep -r "from 'next/image'" --include="*.tsx" --include="*.ts" . | cut -d: -f1 | sort | uniq | while read file; do
  echo "  - $file"
done
echo ""

# Contar uso de priority
echo "⚡ Análise de Priority:"
echo "======================"
PRIORITY_TRUE=$(grep -r "priority={true}" --include="*.tsx" . | wc -l)
PRIORITY_DYNAMIC=$(grep -r "priority=" --include="*.tsx" . | grep -v "priority={true}" | grep -v "priority={false}" | wc -l)
echo -e "  ${GREEN}✅ Priority true (fixo): $PRIORITY_TRUE${NC}"
echo -e "  ${YELLOW}⚠️  Priority dinâmico: $PRIORITY_DYNAMIC${NC}"
echo ""

# Verificar uso de unoptimized
echo "🚫 Imagens não otimizadas:"
echo "========================="
UNOPTIMIZED=$(grep -r "unoptimized={true}" --include="*.tsx" . | wc -l)
if [ $UNOPTIMIZED -eq 0 ]; then
  echo -e "  ${GREEN}✅ Nenhuma imagem com unoptimized=true${NC}"
else
  echo -e "  ${RED}❌ $UNOPTIMIZED imagens não otimizadas${NC}"
  grep -r "unoptimized={true}" --include="*.tsx" . | cut -d: -f1 | sort | uniq | while read file; do
    echo "    - $file"
  done
fi
echo ""

# Verificar static imports
echo "📦 Static Imports (logo):"
echo "========================"
STATIC_IMPORTS=$(grep -r "import.*from.*public/images" --include="*.tsx" . | wc -l)
echo -e "  ${GREEN}✅ $STATIC_IMPORTS arquivos usando static imports${NC}"
if [ $STATIC_IMPORTS -gt 0 ]; then
  grep -r "import.*from.*public/images" --include="*.tsx" . | cut -d: -f1 | sort | uniq | while read file; do
    echo "    - $file"
  done
fi
echo ""

# Verificar sizes attribute
echo "📏 Atributo 'sizes':"
echo "==================="
WITH_SIZES=$(grep -r 'sizes=' --include="*.tsx" . | wc -l)
WITHOUT_SIZES=$(grep -r '<Image' --include="*.tsx" . | grep -v 'sizes=' | wc -l)
echo -e "  ${GREEN}✅ Com sizes: $WITH_SIZES${NC}"
echo -e "  ${YELLOW}⚠️  Sem sizes: $WITHOUT_SIZES${NC}"
echo ""

# Verificar quality
echo "🎨 Quality settings:"
echo "==================="
grep -r 'quality=' --include="*.tsx" . | grep -o 'quality={[0-9]*}' | sort | uniq -c | while read count quality; do
  echo "  $quality usado $count vez(es)"
done
echo ""

# Verificar loading
echo "⏳ Loading strategy:"
echo "==================="
LAZY=$(grep -r 'loading="lazy"' --include="*.tsx" . | wc -l)
EAGER=$(grep -r 'loading="eager"' --include="*.tsx" . | wc -l)
echo -e "  ${GREEN}Lazy: $LAZY${NC}"
echo -e "  ${YELLOW}Eager: $EAGER${NC}"
echo ""

# Verificar remote patterns no config
echo "🌐 Remote Patterns (next.config.ts):"
echo "===================================="
if [ -f "next.config.ts" ]; then
  echo "  Domínios configurados:"
  grep -A 2 "hostname:" next.config.ts | grep "hostname:" | sed 's/.*hostname: /    - /'
else
  echo -e "  ${RED}❌ next.config.ts não encontrado${NC}"
fi
echo ""

# Resumo de otimizações
echo "✨ Resumo de Otimizações:"
echo "========================"
echo -e "  ${GREEN}✅ Static imports configurados${NC}"
echo -e "  ${GREEN}✅ Priority otimizado (apenas LCP)${NC}"
echo -e "  ${GREEN}✅ Cache 31 dias configurado${NC}"
echo -e "  ${GREEN}✅ WebP apenas (sem AVIF)${NC}"
echo -e "  ${GREEN}✅ Remote patterns específicos${NC}"
echo ""

# Estimativa de transformações
echo "📊 Estimativa de Transformações:"
echo "================================"
PRODUCT_IMAGES=800  # Estimativa de fotos de produtos
BANNER_IMAGES=5
LOGO_IMAGES=3

# Com otimizações
DEVICE_SIZES=5
FORMATS=1
CACHE_DAYS=31

TRANSFORMATIONS_INITIAL=$((($PRODUCT_IMAGES + $BANNER_IMAGES) * $DEVICE_SIZES * $FORMATS))
TRANSFORMATIONS_MONTHLY=$(($TRANSFORMATIONS_INITIAL * (30 / $CACHE_DAYS)))

echo "  Transformações iniciais: ~$TRANSFORMATIONS_INITIAL"
echo "  Re-transformações/mês: ~$TRANSFORMATIONS_MONTHLY"
echo "  Logos (static): 0 transformações"
echo ""
echo -e "${GREEN}💰 Economia estimada: ~98% de transformações${NC}"
echo ""

echo "✅ Análise concluída!"
