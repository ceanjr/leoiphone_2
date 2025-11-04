'use client'

import { useState } from 'react'

export interface ProductCardData {
  id: string
  nome: string
  codigo_produto: string | null
  preco: number
  preco_promocional: number
  foto_principal: string
  condicao?: 'novo' | 'seminovo' | 'usado'
  garantia?: 'nenhuma' | '3_meses' | '6_meses' | '1_ano'
  nivel_bateria?: number
  cores?: string[]
}

interface ProductCardRendererProps {
  produto: ProductCardData
  visible?: boolean
}

export function ProductCardRenderer({ produto, visible = false }: ProductCardRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  console.log(produto)

  // Criar URL proxied para evitar problemas de CORS
  const getProxiedImageUrl = (url: string) => {
    if (!url) return ''
    // Se for Firebase Storage ou Supabase Storage, usar proxy
    if (url.includes('firebasestorage.googleapis.com') || url.includes('supabase.co/storage')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const imageUrl = getProxiedImageUrl(produto.foto_principal)

  // Calcular desconto percentual
  const desconto = Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)

  // Ícone de chama em SVG inline
  const FlameIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )

  // BatteryIcon component inline
  const BatteryIcon = ({ level }: { level: number }) => {
    const getBatteryState = () => {
      if (level >= 80) {
        return { color: '#22c55e', bars: 4 }
      } else if (level >= 70) {
        return { color: '#facc15', bars: 3 }
      } else {
        return { color: '#ef4444', bars: 2 }
      }
    }

    const { color, bars } = getBatteryState()

    return (
      <svg
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect
          x="0.5"
          y="0.5"
          width="16"
          height="11"
          rx="2"
          stroke="white"
          strokeWidth="1"
          fill="none"
        />
        <rect x="17" y="3.5" width="2.5" height="5" rx="1" fill="white" />
        {[...Array(4)].map((_, index) => (
          <rect
            key={index}
            x={2.5 + index * 3.5}
            y="3"
            width="2"
            height="6"
            rx="0.5"
            fill={index < bars ? color : 'rgba(255, 255, 255, 0.15)'}
          />
        ))}
      </svg>
    )
  }

  // Função para obter texto de garantia
  const getGarantiaText = (garantia?: string) => {
    if (!garantia || garantia === 'nenhuma') return null

    const garantiaMap: Record<string, string> = {
      '3_meses': '3 meses',
      '6_meses': '6 meses',
      '1_ano': '1 ano',
    }

    return garantiaMap[garantia] || null
  }

  return (
    <div
      style={{
        position: visible ? 'relative' : 'absolute',
        left: visible ? '0' : '-9999px',
        width: '600px', // Largura fixa para manter proporções
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      id={`product-card-${produto.id}`}
    >
      {/* Container principal - EXATAMENTE igual ao site */}
      <div
        style={{
          minWidth: '240px',
          flexShrink: 0,
          borderRadius: '8px',
          border: '1px solid #27272a',
          backgroundColor: '#09090b',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Badge de Desconto - EXATO do site */}
        {desconto > 0 && (
          <div
            style={{
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(234, 88, 12, 0.2)',
              padding: '8px',
            }}
          >
            <span
              style={{
                color: '#f97316',
                fontSize: '32px',
                display: 'inline-flex',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                position: 'absolute',
                left: '32px',
              }}
            >
              <FlameIcon size={32} />
            </span>
            <span
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#f97316',
              }}
            >
              -{desconto}% OFF
            </span>
          </div>
        )}

        {/* Imagem do Produto - EXATA do site */}
        <div
          style={{
            position: 'relative',
            marginBottom: '12px',
            width: '100%',
            paddingBottom: '100%', // aspect-square
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#18181b',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={produto.nome}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '14px', color: '#71717a' }}>Sem imagem</span>
            </div>
          )}
        </div>

        {/* Informações do Produto - EXATAS do site */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Nome do Produto - line-clamp-2 */}
          <h3
            style={{
              fontSize: '38px',
              fontFamily: '"Inter", Arial, sans-serif',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              minHeight: '2.5rem',
            }}
          >
            {produto.nome}
          </h3>

          {/* Código do Produto - EXATO do site */}
          {produto.codigo_produto && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#71717a' }}>Código:</span>
              <span style={{ fontFamily: 'monospace', color: '#a1a1aa' }}>
                {produto.codigo_produto}
              </span>
            </div>
          )}

          {/* Badges - EXATOS do site */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            {produto.condicao === 'novo' && !produto.nivel_bateria && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  backgroundColor: '#16a34a',
                  padding: '2px 6px',
                  fontSize: '16px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                Novo
              </span>
            )}
            {produto.condicao === 'seminovo' && !produto.nivel_bateria && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  backgroundColor: '#d97706',
                  padding: '2px 6px',
                  fontSize: '16px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                Seminovo
              </span>
            )}
            {produto.nivel_bateria && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#3f3f46',
                  padding: '2px 6px',
                  fontSize: '16px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                <BatteryIcon level={produto.nivel_bateria} />
                <span>{produto.nivel_bateria}%</span>
              </span>
            )}
            {getGarantiaText(produto.garantia) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  backgroundColor: '#9333ea',
                  padding: '2px 6px',
                  fontSize: '16px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                Garantia {getGarantiaText(produto.garantia)}
              </span>
            )}
          </div>

          {/* Preços - EXATOS do site */}
          <div
            style={{
              borderTop: '1px solid #27272a',
              paddingTop: '8px',
            }}
          >
            {produto.preco_promocional < produto.preco ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '18px',
                    color: '#71717a',
                    textDecoration: 'line-through',
                  }}
                >
                  R$ {produto.preco.toFixed(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      color: '#f97316',
                      display: 'inline-flex',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  >
                    <FlameIcon size={36} />
                  </span>
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#ffcc00',
                    }}
                  >
                    R$ {produto.preco_promocional.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#ffcc00',
                }}
              >
                R$ {produto.preco_promocional.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animação pulse inline */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `,
        }}
      />
    </div>
  )
}
