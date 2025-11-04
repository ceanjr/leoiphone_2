import { useMemo } from 'react'

// Import direto do JSON
const iphoneColorsData: Record<string, string[]> = {
  "iPhone 7": ["Silver", "Gold", "Rose Gold", "Black", "Jet Black", "(PRODUCT)RED"],
  "iPhone 7 Plus": ["Silver", "Gold", "Rose Gold", "Black", "Jet Black", "(PRODUCT)RED"],
  "iPhone 8": ["Silver", "Gold", "Space Gray", "(PRODUCT)RED"],
  "iPhone 8 Plus": ["Silver", "Gold", "Space Gray", "(PRODUCT)RED"],
  "iPhone X": ["Silver", "Space Gray"],
  "iPhone XR": ["Black", "White", "Blue", "Yellow", "Coral", "(PRODUCT)RED"],
  "iPhone XS": ["Silver", "Space Gray", "Gold"],
  "iPhone XS Max": ["Silver", "Space Gray", "Gold"],
  "iPhone 11": ["Black", "White", "Purple", "Yellow", "Green", "(PRODUCT)RED"],
  "iPhone 11 Pro": ["Silver", "Space Gray", "Gold", "Midnight Green"],
  "iPhone 11 Pro Max": ["Silver", "Space Gray", "Gold", "Midnight Green"],
  "iPhone 12": ["Black", "White", "Blue", "Green", "Purple", "(PRODUCT)RED"],
  "iPhone 12 Mini": ["Black", "White", "Blue", "Green", "Purple", "(PRODUCT)RED"],
  "iPhone 12 Pro": ["Silver", "Graphite", "Gold", "Pacific Blue"],
  "iPhone 12 Pro Max": ["Silver", "Graphite", "Gold", "Pacific Blue"],
  "iPhone 13": ["Pink", "Blue", "Midnight", "Starlight", "Green", "(PRODUCT)RED"],
  "iPhone 13 Mini": ["Pink", "Blue", "Midnight", "Starlight", "Green", "(PRODUCT)RED"],
  "iPhone 13 Pro": ["Silver", "Graphite", "Gold", "Sierra Blue", "Alpine Green"],
  "iPhone 13 Pro Max": ["Silver", "Graphite", "Gold", "Sierra Blue", "Alpine Green"],
  "iPhone 14": ["Blue", "Purple", "Midnight", "Starlight", "Yellow", "(PRODUCT)RED"],
  "iPhone 14 Plus": ["Blue", "Purple", "Midnight", "Starlight", "Yellow", "(PRODUCT)RED"],
  "iPhone 14 Pro": ["Space Black", "Silver", "Gold", "Deep Purple"],
  "iPhone 14 Pro Max": ["Space Black", "Silver", "Gold", "Deep Purple"],
  "iPhone 15": ["Pink", "Yellow", "Green", "Blue", "Black"],
  "iPhone 15 Plus": ["Pink", "Yellow", "Green", "Blue", "Black"],
  "iPhone 15 Pro": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
  "iPhone 15 Pro Max": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
  "iPhone 16": ["Ultramarine", "Teal", "Pink", "White", "Black"],
  "iPhone 16 Plus": ["Ultramarine", "Teal", "Pink", "White", "Black"],
  "iPhone 16 Pro": ["Desert Titanium", "Natural Titanium", "White Titanium", "Black Titanium"],
  "iPhone 16 Pro Max": ["Desert Titanium", "Natural Titanium", "White Titanium", "Black Titanium"],
  "iPhone 17": ["Black", "Lavender", "Mist Blue", "Sage", "White"],
  "iPhone 17 Air": ["Black", "Silver", "Light Blue", "Gardenia"],
  "iPhone 17 Pro": ["Black", "Silver", "Deep Blue", "Cosmic Orange"],
  "iPhone 17 Pro Max": ["Black", "Silver", "Deep Blue", "Cosmic Orange"]
}

interface UseIPhoneColorsResult {
  isIPhone: boolean
  detectedModel: string | null
  availableColors: string[]
}

/**
 * Hook para detectar modelo de iPhone e retornar cores disponíveis
 * @param productName Nome do produto
 * @returns Objeto com informações sobre o iPhone detectado
 */
export function useIPhoneColors(productName: string): UseIPhoneColorsResult {
  return useMemo(() => {
    if (!productName) {
      return { isIPhone: false, detectedModel: null, availableColors: [] }
    }

    // Verifica se contém "iPhone" (case insensitive)
    const hasIPhone = /iphone/i.test(productName)

    if (!hasIPhone) {
      return { isIPhone: false, detectedModel: null, availableColors: [] }
    }

    // Patterns para detectar modelos de iPhone
    // Ordem importa: modelos mais específicos primeiro
    const modelPatterns = [
      // iPhone 17
      /iphone\s*17\s*pro\s*max/i,
      /iphone\s*17\s*pro/i,
      /iphone\s*17\s*air/i,
      /iphone\s*17/i,

      // iPhone 16
      /iphone\s*16\s*pro\s*max/i,
      /iphone\s*16\s*pro/i,
      /iphone\s*16\s*plus/i,
      /iphone\s*16/i,

      // iPhone 15
      /iphone\s*15\s*pro\s*max/i,
      /iphone\s*15\s*pro/i,
      /iphone\s*15\s*plus/i,
      /iphone\s*15/i,

      // iPhone 14
      /iphone\s*14\s*pro\s*max/i,
      /iphone\s*14\s*pro/i,
      /iphone\s*14\s*plus/i,
      /iphone\s*14/i,

      // iPhone 13
      /iphone\s*13\s*pro\s*max/i,
      /iphone\s*13\s*pro/i,
      /iphone\s*13\s*mini/i,
      /iphone\s*13/i,

      // iPhone 12
      /iphone\s*12\s*pro\s*max/i,
      /iphone\s*12\s*pro/i,
      /iphone\s*12\s*mini/i,
      /iphone\s*12/i,

      // iPhone 11
      /iphone\s*11\s*pro\s*max/i,
      /iphone\s*11\s*pro/i,
      /iphone\s*11/i,

      // iPhone X
      /iphone\s*xs\s*max/i,
      /iphone\s*xs/i,
      /iphone\s*xr/i,
      /iphone\s*x/i,

      // iPhone 8
      /iphone\s*8\s*plus/i,
      /iphone\s*8/i,

      // iPhone 7
      /iphone\s*7\s*plus/i,
      /iphone\s*7/i,
    ]

    // Tenta encontrar o padrão
    for (const pattern of modelPatterns) {
      const match = productName.match(pattern)
      if (match) {
        // Normaliza o modelo encontrado
        const rawModel = match[0].trim()
        const normalizedModel = normalizeModelName(rawModel)

        // Busca as cores no objeto de dados
        const colors = iphoneColorsData[normalizedModel]

        if (colors && colors.length > 0) {
          return {
            isIPhone: true,
            detectedModel: normalizedModel,
            availableColors: colors,
          }
        }

        // Modelo detectado mas sem cores no JSON
        return {
          isIPhone: true,
          detectedModel: normalizedModel,
          availableColors: [],
        }
      }
    }

    // É iPhone mas modelo não detectado
    return { isIPhone: true, detectedModel: null, availableColors: [] }
  }, [productName])
}

/**
 * Normaliza o nome do modelo para corresponder ao formato no cores.json
 */
function normalizeModelName(rawModel: string): string {
  // Remove espaços extras e normaliza
  return rawModel
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) => {
      // Primeira palavra sempre "iPhone" (formato específico)
      if (index === 0) {
        return 'iPhone'
      }
      // Números mantém como estão
      if (/^\d+$/.test(word)) {
        return word
      }
      // Pro, Max, Plus, Mini, Air com primeira letra maiúscula
      if (/^(pro|max|plus|mini|air|xs|xr)$/i.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
      // Caso contrário, primeira letra maiúscula
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
