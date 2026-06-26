import { Info } from 'lucide-react'

export default function MoonHero() {
  return (
    <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden bg-space-black">
      {/* Sci-fi HUD overlay grid */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-30 z-1" />

      {/* Decorative glow gradients */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-cyan-glow/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-blue-glow/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main centered container */}
      <div className="w-full max-w-4xl mx-auto px-6 text-center relative z-10 flex flex-col items-center gap-8">
        
        {/* Status tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-glow/5 border border-cyan-glow/15 text-[10px] tracking-widest text-cyan-glow uppercase font-orbitron">
          <Info className="w-3 h-3" /> System Uplink Active
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-orbitron tracking-tight leading-none text-white">
            EXPLORING THE <br />
            <span className="text-glow-cyan text-cyan-glow">LUNAR FRONTIER</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            COORDINATE NODE: [LAT: 38.2° N, LON: 18.4° W] // CORE_ESTABLISHED
          </p>
        </div>

        {/* Framing brackets for bio details */}
        <div className="hud-panel p-6 max-w-2xl border-glow-cyan relative">
          <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed font-sans">
            Hi, I'm a Computer Science student developing advanced systems for the next generation of space telemetry. Welcome to my lunar command center.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <a
            href="#viewer"
            className="px-6 py-3 bg-cyan-glow text-space-black font-orbitron font-semibold text-xs tracking-wider uppercase rounded hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            [ 3D Moon Orbit ]
          </a>
          <a
            href="#info"
            className="px-6 py-3 border border-hud-border text-gray-300 font-orbitron text-xs tracking-wider uppercase rounded hover:border-cyan-glow hover:text-white transition-all duration-300 cursor-pointer"
          >
            Telemetry Data
          </a>
          <a
            href="#game"
            className="px-6 py-3 border border-hud-border text-gray-300 font-orbitron text-xs tracking-wider uppercase rounded hover:border-cyan-glow hover:text-white transition-all duration-300 cursor-pointer"
          >
            Lander Mission
          </a>
        </div>
      </div>

      {/* Decorative bottom edge line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-hud-border to-transparent" />
    </section>
  )
}
