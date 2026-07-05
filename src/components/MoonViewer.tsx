import { useState, useRef, useEffect } from 'react'
import Spline from '@splinetool/react-spline'
import { RefreshCw, Zap, X } from 'lucide-react'

const LUNAR_STATS = [
  { label: 'DIAMETER', value: '3,474 KM' },
  { label: 'GRAVITY', value: '1.62 M/S² (0.17G)' },
  { label: 'ORBIT_PERIOD', value: '27.3 DAYS' },
  { label: 'MEAN_TEMP', value: '-130°C TO +120°C' }
]

export default function MoonViewer() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMoonSelected, setIsMoonSelected] = useState(false)
  const [splineKey, setSplineKey] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const splineRef = useRef<any>(null)
  const zoomRef = useRef<number>(1.0)

  // Force reload/reset of Spline scene
  const handleReset = () => {
    setSplineKey((prev) => prev + 1)
    setIsLoading(true)
    setIsMoonSelected(false)
    zoomRef.current = 1.0
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMoonSelected(true)
  }

  const handleDeselect = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setIsMoonSelected(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent native browser context menu
    handleDeselect(e)
  }

  const onSplineLoad = (splineApp: any) => {
    splineRef.current = splineApp
    setIsLoading(false)
  }

  // Handle body scroll locking
  useEffect(() => {
    if (isMoonSelected) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMoonSelected])

  // Deselect when clicking outside the moon container
  useEffect(() => {
    if (!isMoonSelected) return

    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleDeselect()
      }
    }

    // Small delay to prevent the initial click from instantly triggering a click-outside deselect
    const timer = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [isMoonSelected])

  // Reset zoom when deselecting
  useEffect(() => {
    if (!isMoonSelected) {
      zoomRef.current = 1.0
      if (splineRef.current) {
        const app = splineRef.current
        if (typeof app.setCameraZoom === 'function') {
          app.setCameraZoom(1.0)
        } else if (typeof app.setZoom === 'function') {
          app.setZoom(1.0)
        }
      }
    }
  }, [isMoonSelected])

  // Handle manual zoom via scroll wheel when moon is selected
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (isMoonSelected) {
        e.preventDefault()
        e.stopPropagation()

        const zoomFactor = 0.05
        const zoomDelta = -e.deltaY * zoomFactor * 0.005
        const nextZoom = Math.max(0.5, Math.min(3.0, zoomRef.current + zoomDelta))
        zoomRef.current = nextZoom

        if (splineRef.current) {
          const app = splineRef.current
          if (typeof app.setCameraZoom === 'function') {
            app.setCameraZoom(nextZoom)
          } else if (typeof app.setZoom === 'function') {
            app.setZoom(nextZoom)
          }
        }
      }
    }

    if (isMoonSelected) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [isMoonSelected])

  // Add Escape key handler for deselecting
  useEffect(() => {
    if (!isMoonSelected) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselect()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoonSelected])

  return (
    <section id="viewer" className="relative w-full min-h-screen bg-space-black flex items-center justify-center py-24 md:py-28 select-none overflow-hidden">
      {/* Sci-fi HUD overlay grid */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20 z-0" />

      {/* Main Responsive Grid Layout */}
      <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative">
        
        {/* Left Side: Title & Reset Console */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6 justify-center">
          {/* Title Panel */}
          <div className="hud-panel p-5 border-glow-cyan w-full">
            <div className="text-[9px] text-cyan-glow tracking-widest font-orbitron uppercase">
              // SYS_ORBITAL_VISUALIZER
            </div>
            <h2 className="text-base font-black font-orbitron text-white mt-1 uppercase tracking-wide">
              Luna Telemetry Visualizer
            </h2>
            <p className="text-[9px] text-gray-500 font-mono mt-1.5 leading-relaxed uppercase">
              Target: SELENE (LUNA) <br />
              Status: {isMoonSelected ? 'FOCUS_MODE // INTERACTIVE' : 'SYSTEM_CONNECTED // IDLE'}
            </p>
          </div>

          {/* Reset button panel */}
          <div className="hud-panel p-3 border-glow-cyan bg-space-black/90 w-full flex items-center justify-center">
            <button
              onClick={handleReset}
              title="Reset System"
              className="p-2 rounded border border-hud-border hover:border-cyan-glow hover:text-cyan-glow hover:shadow-[0_0_8px_rgba(0,240,255,0.2)] text-gray-400 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 w-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[9px] font-orbitron uppercase tracking-wider font-semibold">
                RESET SYSTEM
              </span>
            </button>
          </div>
        </div>

        {/* Center Section: Centered 3D Moon Canvas Container */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative">
          
          {/* Top Instruction Tag */}
          <div className="mb-4 h-8 flex items-center justify-center">
            {isMoonSelected ? (
              <button
                onClick={(e) => handleDeselect(e)}
                className="px-3 py-1.5 border border-cyan-glow bg-space-black text-cyan-glow hover:bg-cyan-glow/10 font-orbitron text-[9px] uppercase tracking-widest rounded cursor-pointer pointer-events-auto flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all animate-pulse"
              >
                <X className="w-3 h-3" /> [ BACK TO EXPLORATION ]
              </button>
            ) : (
              <div className="text-[9px] text-cyan-glow/60 font-orbitron uppercase tracking-widest border border-hud-border px-3 py-1.5 rounded bg-space-black/40">
                [ CLICK MOON TO SELECT & ZOOM ]
              </div>
            )}
          </div>

          {/* Canvas Wrapper Box */}
          <div 
            ref={containerRef}
            onContextMenu={handleContextMenu}
            className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] aspect-square flex items-center justify-center relative border rounded-full bg-space-black/40 overflow-visible transition-all duration-500 z-10"
            style={{ 
              borderColor: isMoonSelected ? 'var(--color-cyan-glow)' : 'var(--color-hud-border)',
              boxShadow: isMoonSelected 
                ? '0 0 30px rgba(0, 240, 255, 0.25), inset 0 0 20px rgba(0, 240, 255, 0.1)' 
                : '0 0 15px rgba(0, 240, 255, 0.05)',
            }}
          >
            {/* Loading HUD overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-space-black/90 backdrop-blur-sm pointer-events-none rounded-full">
                <div className="hud-panel p-5 border-glow-cyan flex flex-col items-center gap-3 max-w-[180px] animate-cyber-flicker">
                  <div className="text-[9px] text-cyan-glow tracking-widest font-orbitron uppercase animate-pulse text-center">
                    INITIALIZING SYS...
                  </div>
                  <div className="w-12 h-[1px] bg-cyan-glow/20 relative overflow-hidden">
                    <div className="absolute h-full w-1/2 bg-cyan-glow animate-shimmer" />
                  </div>
                </div>
              </div>
            )}

            {/* Click Interceptor Overlay (only when moon is deselected) */}
            {!isMoonSelected && (
              <div 
                onClick={handleSelect}
                className="absolute inset-0 cursor-pointer bg-transparent z-20 rounded-full"
                title="Click to interact with moon"
              />
            )}

            {/* Actual Spline Canvas wrapper with absolute positioning and no WebGL-breaking border-radius */}
            <div className="absolute inset-0 w-full h-full overflow-visible">
              <Spline
                key={splineKey}
                scene="https://prod.spline.design/lX-rliVynvlgqRPQ/scene.splinecode"
                onLoad={onSplineLoad}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          
          {/* Focus hint below Moon */}
          {isMoonSelected && (
            <div className="mt-4 text-[8px] text-gray-500 font-mono uppercase tracking-wider text-center animate-pulse">
              RIGHT-CLICK MOON OR PRESS ESC TO DESELECT
            </div>
          )}
        </div>

        {/* Right Side: Lunar Stats Panel & Dynamic Guidance */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6 justify-center">
          {/* Stats Panel */}
          <div className="hud-panel p-5 border-glow-cyan w-full">
            <div className="border-b border-hud-border pb-2 mb-2">
              <h3 className="font-orbitron font-bold text-xs tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-glow" /> LUNAR PHYSICAL STATS
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left font-mono">
              {LUNAR_STATS.map((stat, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-[8px] text-gray-500 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-xs text-white font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="hud-panel p-3 border-glow-cyan w-full text-center">
            <div className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">
              {isMoonSelected 
                ? 'SCROLL ON MOON TO ZOOM // DRAG TO ROTATE'
                : 'SCROLL PAGE FREELY // CLICK MOON TO ORBIT'}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
