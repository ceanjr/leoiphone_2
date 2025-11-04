'use client'

import { useEffect, useState } from 'react'
import { Clock, Flame } from 'lucide-react'

interface CountdownTimerProps {
  endDate: string | null
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ endDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!endDate) return

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft(null)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft({ days, hours, minutes, seconds })
      setIsExpired(false)
    }

    // Calcular imediatamente
    calculateTimeLeft()

    // Atualizar a cada segundo
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (!endDate || isExpired) return null
  if (!timeLeft) return null

  return (
    <div
      className={`inline-flex w-full flex-col gap-2 rounded-xl p-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-2.5 ${className}`}
    >
      {/* Countdown Display */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {/* Dias (se houver) */}
        {timeLeft.days > 0 && (
          <>
            <div className="flex min-w-[48px] flex-col items-center justify-center rounded-lg border border-orange-500/20 bg-black/40 px-2 py-1.5 sm:min-w-[52px] sm:px-2.5 sm:py-2">
              <span className="text-xl leading-none font-bold text-white tabular-nums sm:text-2xl">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="mt-1 text-[9px] font-medium tracking-wide text-orange-400 uppercase sm:text-[10px]">
                Dias
              </span>
            </div>
            <span className="text-lg font-bold text-orange-500 sm:text-xl">:</span>
          </>
        )}

        {/* Horas */}
        <div className="flex min-w-[48px] flex-col items-center justify-center rounded-lg border border-orange-500/20 bg-black/40 px-2 py-1.5 sm:min-w-[52px] sm:px-2.5 sm:py-2">
          <span className="text-xl leading-none font-bold text-white tabular-nums sm:text-2xl">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[9px] font-medium tracking-wide text-orange-400 uppercase sm:text-[10px]">
            Hrs
          </span>
        </div>
        <span className="text-lg font-bold text-orange-500 sm:text-xl">:</span>

        {/* Minutos */}
        <div className="flex min-w-[48px] flex-col items-center justify-center rounded-lg border border-orange-500/20 bg-black/40 px-2 py-1.5 sm:min-w-[52px] sm:px-2.5 sm:py-2">
          <span className="text-xl leading-none font-bold text-white tabular-nums sm:text-2xl">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[9px] font-medium tracking-wide text-orange-400 uppercase sm:text-[10px]">
            Min
          </span>
        </div>
        <span className="text-lg font-bold text-orange-500 sm:text-xl">:</span>

        {/* Segundos */}
        <div className="flex min-w-[48px] flex-col items-center justify-center rounded-lg border border-orange-500/20 bg-black/40 px-2 py-1.5 sm:min-w-[52px] sm:px-2.5 sm:py-2">
          <span className="text-xl leading-none font-bold text-white tabular-nums sm:text-2xl">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[9px] font-medium tracking-wide text-orange-400 uppercase sm:text-[10px]">
            Seg
          </span>
        </div>
      </div>
    </div>
  )
}
