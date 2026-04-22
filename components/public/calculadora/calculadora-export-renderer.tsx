'use client'

// ─────────────────────────────────────────────
// Constante exportada para uso externo (ex: html2canvas width)
// ─────────────────────────────────────────────
export const EXPORT_WIDTH = 800

/**
 * Converte uma URL (relativa ou absoluta) para base64.
 * Use antes de chamar html2canvas para garantir que a logo apareça no export.
 *
 * Exemplo de uso:
 *   const logoBase64 = await logoToBase64('/images/logo.png')
 *   // → passa logoBase64 para o prop logoSrc
 */
export async function logoToBase64(src: string): Promise<string> {
  const res = await fetch(src)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─────────────────────────────────────────────
// Função utilitária local — sem dependência externa
// Garante funcionamento no contexto de export (html2canvas, puppeteer, etc.)
// ─────────────────────────────────────────────
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

// ─────────────────────────────────────────────
// Tema — cores centralizadas, fácil de trocar
// ─────────────────────────────────────────────
interface ExportTheme {
  background: string
  surface: string
  border: string
  divider: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  successBg: string
  successBorder: string
  successText: string
  successLight: string
}

const defaultTheme: ExportTheme = {
  background: '#000000',
  surface: '#0d0d0d',
  border: '#1f1f1f',
  divider: '#1f1f1f',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  accent: '#ffcc00',
  successBg: 'rgba(34, 197, 94, 0.05)',
  successBorder: 'rgba(34, 197, 94, 0.2)',
  successText: '#22c55e',
  successLight: '#4ade80',
}

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────
export interface ParcelaData {
  numero: number
  valorParcela: number
  valorTotal: number
  semJuros: boolean
  taxaMensal: number
}

interface CalculadoraExportRendererProps {
  /** Valor numérico do produto — formatado internamente */
  valor: number
  parcelas: ParcelaData[]
  visible?: boolean
  /**
   * URL absoluta ou base64 do logo.
   * Evitar paths relativos (ex: "/images/logo.png") — quebram em html2canvas/puppeteer.
   * Exemplo: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png`
   */
  logoSrc?: string
  theme?: ExportTheme
}

// ─────────────────────────────────────────────
// Estilos extraídos — fora do JSX para legibilidade
// ─────────────────────────────────────────────
function makeStyles(t: ExportTheme) {
  return {
    root: {
      width: `${EXPORT_WIDTH}px`,
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    } as React.CSSProperties,

    wrapper: {
      backgroundColor: t.background,
      padding: '40px',
      borderRadius: '12px',
      border: `1px solid ${t.border}`,
    } as React.CSSProperties,

    header: {
      textAlign: 'center',
      marginBottom: '40px',
    } as React.CSSProperties,

    logo: {
      maxWidth: '180px',
      marginBottom: '20px',
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
    } as React.CSSProperties,

    subtitle: {
      color: t.textSecondary,
      fontSize: '32px',
      margin: '0 0 20px 0',
      fontWeight: 400,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },

    valorDestaque: {
      color: t.accent,
      fontSize: '52px',
      margin: 0,
      fontWeight: 600,
    } as React.CSSProperties,

    divider: (height: number = 2) =>
      ({
        height: `${height}px`,
        backgroundColor: t.divider,
        margin: '30px 0',
      }) as React.CSSProperties,

    parcelaLista: {
      marginBottom: '30px',
    } as React.CSSProperties,

    parcelaRow: (semJuros: boolean, index: number) =>
      ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        backgroundColor: semJuros
          ? t.successBg
          : index % 2 === 0
            ? t.surface
            : 'transparent',
        marginBottom: '4px',
        borderRadius: '8px',
        border: semJuros
          ? `1px solid ${t.successBorder}`
          : '1px solid transparent',
      }) as React.CSSProperties,

    parcelaLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    } as React.CSSProperties,

    parcelaNumero: (semJuros: boolean) =>
      ({
        color: semJuros ? t.successText : t.textSecondary,
        fontSize: '30px',
        fontWeight: 600,
        minWidth: '52px',
      }) as React.CSSProperties,

    parcelaValor: (semJuros: boolean) =>
      ({
        color: semJuros ? t.successLight : t.textPrimary,
        fontSize: '34px',
        fontWeight: 'bold',
      }) as React.CSSProperties,

    badgeSemJuros: {
      color: defaultTheme.successText,
      fontSize: '14px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      padding: '5px 14px',
      borderRadius: '12px',
    } as React.CSSProperties,

    totalCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '2px',
    } as React.CSSProperties,

    totalLabel: {
      color: t.textSecondary,
      fontSize: '20px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    totalValor: {
      color: t.accent,
      fontSize: '34px',
      fontWeight: 500,
    } as React.CSSProperties,

    footer: {
      textAlign: 'center',
    } as React.CSSProperties,

    footerLine1: {
      color: t.textMuted,
      fontSize: '24px',
      margin: '0 0 8px 0',
    } as React.CSSProperties,

    footerLine2: {
      color: t.textMuted,
      fontSize: '24px',
      margin: 0,
    } as React.CSSProperties,
  }
}

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────
export function CalculadoraExportRenderer({
  valor,
  parcelas,
  visible = false,
  logoSrc,
  theme = defaultTheme,
}: CalculadoraExportRendererProps) {
  const s = makeStyles(theme)

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  /**
   * Posicionamento:
   * - visible=false → fora do viewport via translate no root (sem reflow global)
   * - visible=true  → fluxo normal
   * Nota: o scale fica no wrapper interno para não colidir com o translateX aqui.
   */
  const positionStyle: React.CSSProperties = visible
    ? { position: 'relative' }
    : {
        position: 'fixed',
        left: '-9999px',
        visibility: 'hidden',
        pointerEvents: 'none',
        top: 0,
        zIndex: -1,
      }

  return (
    <div
      id="calculadora-export"
      role="img"
      aria-label={`Simulação de parcelamento para ${formatarMoeda(valor)}`}
      style={{ ...s.root, ...positionStyle }}
    >
      <div style={s.wrapper}>
        {/* Header */}
        <div style={s.header}>
          <img
            src={logoSrc ?? '/images/logo.png'}
            alt="Léo iPhone"
            style={s.logo}
            onError={(e) => {
              // Logo não carregou — oculta silenciosamente sem quebrar o export
              e.currentTarget.style.display = 'none'
            }}
          />
          <p style={s.subtitle}>Simulação de Parcelamento</p>
          <p style={s.valorDestaque}>{formatarMoeda(valor)}</p>
        </div>

        <div style={s.divider(2)} />

        {/* Lista de parcelas */}
        <div style={s.parcelaLista}>
          {parcelas.map((parcela, index) => (
            <div
              key={`parcela-${parcela.numero}-${index}`}
              style={s.parcelaRow(parcela.semJuros, index)}
            >
              <div style={s.parcelaLeft}>
                <span style={s.parcelaNumero(parcela.semJuros)}>
                  {parcela.numero}x
                </span>
                <span style={s.parcelaValor(parcela.semJuros)}>
                  {formatarMoeda(parcela.valorParcela)}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                {parcela.semJuros ? (
                  <span style={s.badgeSemJuros}>SEM JUROS</span>
                ) : (
                  <div style={s.totalCol}>
                    <span style={s.totalLabel}>Total</span>
                    <span style={s.totalValor}>
                      {formatarMoeda(parcela.valorTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={s.divider(1)} />

        {/* Footer */}
        <div style={s.footer}>
          <p style={s.footerLine1}>
            💳 Valores calculados com taxas de cartão de crédito
          </p>
          <p style={s.footerLine2}>Gerado em {dataAtual}</p>
        </div>
      </div>
    </div>
  )
}