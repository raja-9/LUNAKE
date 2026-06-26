import { useState, useEffect } from 'react'

export default function Navbar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // format as UTC HH:MM:SS
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const mm = String(now.getUTCMinutes()).padStart(2, '0')
      const ss = String(now.getUTCSeconds()).padStart(2, '0')
      setTime(`${hh}:${mm}:${ss} UTC`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full z-40 px-4 md:px-8 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between hud-panel p-4 pointer-events-auto border-glow-cyan text-xs tracking-widest font-orbitron uppercase">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-glow animate-cyber-flicker shadow-[0_0_8px_#00f0ff]" />
          <a href="#hero" className="font-extrabold text-sm text-glow-cyan text-white hover:text-cyan-glow transition-colors">
            LUNAKE // LUNAR_NODE
          </a>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#hero" className="text-gray-400 hover:text-cyan-glow hover:text-glow-cyan transition-colors">
            [ 01 // OVERVIEW ]
          </a>
          <a href="#viewer" className="text-gray-400 hover:text-cyan-glow hover:text-glow-cyan transition-colors">
            [ 02 // ORBIT ]
          </a>
          <a href="#info" className="text-gray-400 hover:text-cyan-glow hover:text-glow-cyan transition-colors">
            [ 03 // DATA ]
          </a>
          <a href="#game" className="text-gray-400 hover:text-cyan-glow hover:text-glow-cyan transition-colors">
            [ 04 // MISSION ]
          </a>
          <a href="#contact" className="text-gray-400 hover:text-cyan-glow hover:text-glow-cyan transition-colors">
            [ 05 // UPLINK ]
          </a>
        </nav>

        {/* Tech clock & telemetry */}
        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
          <span className="hidden sm:inline">COORD: 38.2° N, 18.4° W</span>
          <span className="text-cyan-glow border border-hud-border px-2 py-0.5 rounded bg-cyan-glow/5">
            {time}
          </span>
        </div>
      </div>
    </header>
  )
}
