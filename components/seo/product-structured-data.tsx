import type { ProdutoComCategoria } from '@/types/produto'

interface ProductStructuredDataProps {
  produto: ProdutoComCategoria
}

export function ProductStructuredData({ produto }: ProductStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br'
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: produto.descricao || `${produto.nome} ${produto.condicao === 'novo' ? 'novo' : 'seminovo'}`,
    image: produto.fotos && produto.fotos.length > 0 ? produto.fotos : [produto.foto_principal],
    brand: {
      '@type': 'Brand',
      name: 'Apple',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/produto/${produto.slug}`,
      priceCurrency: 'BRL',
      price: produto.preco,
      availability: 'https://schema.org/InStock',
      itemCondition: produto.condicao === 'novo' 
        ? 'https://schema.org/NewCondition' 
        : 'https://schema.org/RefurbishedCondition',
      seller: {
        '@type': 'Organization',
        name: 'Léo iPhone',
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
    },
    sku: produto.codigo_produto || produto.id,
    category: produto.categoria?.nome || 'Smartphones',
    ...(produto.nivel_bateria && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Nível de Bateria',
        value: `${produto.nivel_bateria}%`,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
