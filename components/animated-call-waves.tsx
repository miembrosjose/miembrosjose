export function AnimatedCallWaves({ color = "#009d68", glowColor = "rgba(0,157,104,0.6)" }: { color?: string; glowColor?: string }) {
  const generateWavePattern = (index: number) => {
    const pattern = [
      { base: 6, peak: 28, delay: 0 },
      { base: 8, peak: 34, delay: 0.1 },
      { base: 10, peak: 40, delay: 0.2 },
      { base: 12, peak: 38, delay: 0.15 },
      { base: 8, peak: 32, delay: 0.05 },
      { base: 6, peak: 26, delay: 0.25 },
    ]
    return pattern[index % pattern.length]
  }

  return (
    <div className="flex items-center justify-center h-16 gap-1 px-4">
      {Array.from({ length: 20 }).map((_, i) => {
        const wave = generateWavePattern(i)
        return (
          <div
            key={i}
            className="w-1 rounded-full"
            style={{
              height: `${wave.base}px`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${glowColor}`,
              animation: `dynamicWave${i % 3} 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
              animationDelay: `${wave.delay}s`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes dynamicWave0 {
          0%, 100% { height: 8px; opacity: 0.6; }
          25% { height: 24px; opacity: 0.8; }
          50% { height: 42px; opacity: 1; }
          75% { height: 18px; opacity: 0.7; }
        }
        @keyframes dynamicWave1 {
          0%, 100% { height: 6px; opacity: 0.5; }
          33% { height: 38px; opacity: 0.9; }
          66% { height: 20px; opacity: 0.7; }
        }
        @keyframes dynamicWave2 {
          0%, 100% { height: 10px; opacity: 0.7; }
          40% { height: 16px; opacity: 0.8; }
          50% { height: 40px; opacity: 1; }
          60% { height: 12px; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
