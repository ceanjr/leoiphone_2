'use client'

import { formatarMoeda } from '@/lib/utils/calcular-parcelas'

export interface ParcelaData {
  numero: number
  valorParcela: number
  valorTotal: number
  semJuros: boolean
  taxaMensal: number
}

interface CalculadoraExportRendererProps {
  valor: string
  parcelas: ParcelaData[]
  visible?: boolean
}

export function CalculadoraExportRenderer({
  valor,
  parcelas,
  visible = false,
}: CalculadoraExportRendererProps) {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      style={{
        position: visible ? 'relative' : 'fixed',
        left: visible ? '0' : '-9999px',
        top: '0',
        width: '800px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: visible ? 'auto' : -1,
      }}
      id="calculadora-export"
    >
      {/* Container principal */}
      <div
        style={{
          backgroundColor: '#000000',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #1f1f1f',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img
            src="/images/logo.png"
            alt="Léo iPhone"
            style={{
              maxWidth: '180px',
              marginBottom: '20px',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
          <p
            style={{
              color: '#a0a0a0',
              fontSize: '28px',
              margin: '0 0 20px 0',
              fontWeight: '400',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Simulação de Parcelamento
          </p>
          <p
            style={{
              color: '#ffcc00',
              fontSize: '42px',
              margin: 0,
              fontWeight: '600',
            }}
          >
            R$ {valor}
          </p>
        </div>

        {/* Linha separadora */}
        <div
          style={{
            height: '2px',
            backgroundColor: '#1f1f1f',
            margin: '30px 0',
          }}
        />

        {/* Tabela de parcelas */}
        <div style={{ marginBottom: '30px' }}>
          {parcelas.map((parcela, index) => (
            <div
              key={parcela.numero}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                backgroundColor: parcela.semJuros
                  ? 'rgba(34, 197, 94, 0.05)'
                  : index % 2 === 0
                    ? '#0d0d0d'
                    : 'transparent',
                marginBottom: '4px',
                borderRadius: '8px',
                border: parcela.semJuros
                  ? '1px solid rgba(34, 197, 94, 0.2)'
                  : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span
                  style={{
                    color: parcela.semJuros ? '#22c55e' : '#a0a0a0',
                    fontSize: '26px',
                    fontWeight: '600',
                    minWidth: '45px',
                  }}
                >
                  {parcela.numero}x
                </span>
                <span
                  style={{
                    color: parcela.semJuros ? '#4ade80' : '#ffffff',
                    fontSize: '28px',
                    fontWeight: 'bold',
                  }}
                >
                  {formatarMoeda(parcela.valorParcela)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                {parcela.semJuros ? (
                  <span
                    style={{
                      color: '#22c55e',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                    }}
                  >
                    SEM JUROS
                  </span>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '2px',
                    }}
                  >
                    <span
                      style={{
                        color: '#a0a0a0',
                        fontSize: '18px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Total
                    </span>
                    <span
                      style={{
                        color: '#ffcc00',
                        fontSize: '24px',
                        fontWeight: '500',
                      }}
                    >
                      {formatarMoeda(parcela.valorTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Linha separadora */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#1f1f1f',
            margin: '30px 0',
          }}
        />

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: '#666666',
              fontSize: '12px',
              margin: '0 0 8px 0',
            }}
          >
            💳 Valores calculados com taxas de cartão de crédito
          </p>
          <p
            style={{
              color: '#666666',
              fontSize: '11px',
              margin: 0,
            }}
          >
            Gerado em {dataAtual}
          </p>
        </div>
      </div>
    </div>
  )
}
