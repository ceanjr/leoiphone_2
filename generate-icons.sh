#!/bin/bash

# Script para gerar ícones PWA a partir do logo
# Requer ImageMagick: sudo apt install imagemagick

INPUT="public/images/logo.png"
OUTPUT_DIR="public/icons"

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick não encontrado. Instale com: sudo apt install imagemagick"
    exit 1
fi

# Verificar se o arquivo de entrada existe
if [ ! -f "$INPUT" ]; then
    echo "❌ Arquivo não encontrado: $INPUT"
    exit 1
fi

echo "🎨 Gerando ícones PWA..."

# Criar diretório de saída
mkdir -p "$OUTPUT_DIR"

# Tamanhos necessários para PWA
SIZES=(72 96 128 144 152 192 384 512)

for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$OUTPUT_DIR/icon-${SIZE}x${SIZE}.png"
    echo "  Gerando ${SIZE}x${SIZE}..."
    convert "$INPUT" -resize "${SIZE}x${SIZE}" "$OUTPUT_FILE"
done

# Gerar favicon
echo "  Gerando favicon.ico..."
convert "$INPUT" -resize 32x32 public/favicon.ico

# Gerar apple-touch-icon
echo "  Gerando apple-touch-icon.png..."
convert "$INPUT" -resize 180x180 public/apple-touch-icon.png

echo "✅ Ícones gerados com sucesso!"
echo ""
echo "📁 Arquivos criados:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "🚀 Pronto para PWA!"
