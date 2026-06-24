import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'

interface IntroProps {
  onLaunch: () => void
}

const BOOT_LOGS = [
  "INITIALIZING LUNAR CORE BOOT...",
  "ESTABLISHING SECURE CONNECTION TO MOON_NODE_01...",
  "MAPPING DATA CHANNELS [LAT: 38.2° N, LON: 18.4° W]...",
  "LOADING REAL-TIME LUNAR TEXTURE MAPS...",
  "SPAWNING VECTOR PHYSICS COLLISION GRIDS...",
  "HUD SCANNER ALIGNMENT COMPLETED.",
  "STATUS: SYSTEMS NOMINAL. READY FOR USER COMMAND."
]

export default function Intro({ onLaunch }: IntroProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [launched, setLaunched] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let logIndex = 0
    const logInterval = setInterval(() => {
      if (logIndex < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[logIndex]])
        logIndex++
      } else {
        clearInterval(logInterval)
        // Start progress bar animation
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              setReady(true)
              return 100
            }
            return prev + Math.floor(Math.random() * 8) + 4
          })
        }, 80)
      }
    }, 400)

    return () => {
      clearInterval(logInterval)
    }
  }, [])

  const handleLaunch = () => {
    if (!ready || launched) return
    setLaunched(true)

    // GSAP Launch Animation
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: onLaunch
      })

      // Flicker button first
      tl.to(buttonRef.current, {
        opacity: 0.2,
        duration: 0.1,
        repeat: 3,
        yoyo: true
      })
      // Zoom out and fade container
      tl.to(containerRef.current, {
        scale: 1.15,
        opacity: 0,
        filter: 'blur(20px)',
        duration: 0.8,
        ease: 'power3.inOut'
      })
    }, containerRef)

    return () => ctx.revert()
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-space-black z-50 flex flex-col items-center justify-center p-6 font-mono select-none"
    >
      {/* Sci-fi HUD outline */}
      <div className="absolute inset-8 border border-cyan-glow/10 pointer-events-none rounded hud-grid" />
      
      <div className="w-full max-w-xl flex flex-col gap-6 relative z-10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-hud-border pb-3 text-xs tracking-widest text-cyan-glow/60">
          <span>SYSTEM_BOOT // PORTFOLIO_V1.0</span>
          <span>ONLINE</span>
        </div>

        {/* Boot Logs */}
        <div className="h-48 text-[11px] md:text-xs text-gray-400 space-y-2 overflow-y-auto leading-relaxed scrollbar-none font-mono">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-cyan-glow select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          {!ready && logs.length === BOOT_LOGS.length && (
            <div className="text-cyan-glow animate-pulse-slow">COMPILING TELEMETRY CHANNELS...</div>
          )}
        </div>

        {/* Loading Progress Bar */}
        {logs.length === BOOT_LOGS.length && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500 tracking-wider">
              <span>MEMORY ALLOCATION</span>
              <span>{Math.min(progress, 100)}%</span>
            </div>
            <div className="w-full h-1 bg-hud-gray rounded-full overflow-hidden border border-hud-border/20">
              <div
                className="h-full bg-cyan-glow shadow-[0_0_8px_#00f0ff] transition-all duration-75"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Launch Button */}
        <div className="h-16 flex items-center justify-center">
          {ready && (
            <button
              ref={buttonRef}
              onClick={handleLaunch}
              className="px-8 py-3 bg-cyan-glow/10 border border-cyan-glow text-cyan-glow uppercase tracking-widest font-orbitron font-semibold text-xs rounded hover:bg-cyan-glow hover:text-space-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 cursor-pointer animate-cyber-flicker"
            >
              LAUNCH INTERFACE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
