import { memo } from 'react'

export const BatteryIcon = memo(({ level }: { level: number }) => {
  const getBatteryState = () => {
    if (level >= 80) {
      return {
        color: '#22c55e',
        bars: 4,
      }
    } else if (level >= 70) {
      return {
        color: '#facc15',
        bars: 3,
      }
    } else {
      return {
        color: '#ef4444',
        bars: 2,
      }
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
      className="inline-block"
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
})

BatteryIcon.displayName = 'BatteryIcon'
