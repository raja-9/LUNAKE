import { Rocket, Cpu, Compass } from 'lucide-react'

export default function MiniGame() {
  const launchSimulator = () => {
    // Open the game route in a new tab/window
    window.open('#/game', '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="game" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 overflow-hidden bg-space-black">
      {/* Sci-fi HUD background grid lines */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-25 z-0" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-glow/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center gap-8">
        
        {/* Header telemetry section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-glow/5 border border-cyan-glow/15 text-[10px] tracking-widest text-cyan-glow uppercase font-orbitron">
            <Rocket className="w-3.5 h-3.5 animate-pulse" /> Mission Control Uplink
          </div>
          <h2 className="text-xs tracking-widest text-cyan-glow font-orbitron uppercase font-bold text-glow-cyan">
            [ SECTION_04 // LUNAR_LANDING ]
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-orbitron text-white uppercase tracking-tight">
            APOLLO FLIGHT SIMULATOR
          </h3>
        </div>

        {/* Main Launcher Dashboard Card */}
        <div className="w-full max-w-4xl hud-panel border-glow-cyan p-6 md:p-10 bg-space-black/90 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded">
          
          {/* Left Column: Briefing details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-orbitron font-bold text-white text-sm tracking-wider uppercase flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-glow" /> PILOT MISSION BRIEFING
              </h4>
              <p className="text-xs text-gray-400 font-sans leading-relaxed uppercase">
                Welcome, pilot. You are scheduled for a simulator descent training module. Your target is landing coordinates within the Sea of Tranquility.
              </p>
            </div>

            {/* Spec readout grid */}
            <div className="grid grid-cols-2 gap-4 font-mono text-[10px] text-gray-500 border-t border-b border-hud-border/20 py-4 uppercase">
              <div className="space-y-1">
                <div className="text-cyan-glow font-semibold">[ VEHICLE SPEC ]</div>
                <div className="text-slate-300">MODULE: LM-APOLLO-11</div>
                <div className="text-slate-300">THRUSTER ACCEL: 0.035 G</div>
                <div className="text-slate-300">ROTATION SPEED: 0.035 RAD</div>
              </div>
              <div className="space-y-1">
                <div className="text-cyan-glow font-semibold">[ ENVIRO SPEC ]</div>
                <div className="text-slate-300">GRAVITY FIELD: 1.62 M/S²</div>
                <div className="text-slate-300">ATMOSPHERE: 0.00 kPa</div>
                <div className="text-slate-300">RADAR FREQ: 9.6 GHz</div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-orbitron font-semibold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-glow" /> SYSTEM OBJECTIVES
              </h5>
              <ul className="list-disc list-inside text-[11px] text-gray-400 font-mono space-y-1">
                <li>ALIGN MODULE OVER THE LUNAR LANDING ZONE</li>
                <li>TOUCHDOWN DESCENT RATE MUST NOT EXCEED 1.40 M/S</li>
                <li>LATERAL RATE DRIFT MUST NOT EXCEED 0.80 M/S</li>
                <li>MODULE PITCH ATTITUDE MUST REMAIN WITHIN 16 DEGREES</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Visual Dashboard radar preview and launcher button */}
          <div className="flex flex-col items-center justify-center p-6 border border-hud-border/20 rounded bg-space-black/60 relative overflow-hidden h-full min-h-[250px]">
            
            {/* Ambient circular radar graphic */}
            <div className="absolute w-44 h-44 rounded-full border border-cyan-glow/10 animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-cyan-glow/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-cyan-glow/30 flex items-center justify-center" />
              </div>
              
              {/* Sweep line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-t from-transparent via-cyan-glow/30 to-transparent rotate-45" />
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-t from-transparent via-cyan-glow/30 to-transparent -rotate-45" />
            </div>

            {/* Floating visual indicators */}
            <div className="absolute top-4 left-4 font-mono text-[8px] text-gray-500 uppercase tracking-widest">
              UPLINK_READY // FREQ: OK
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-[8px] text-gray-500 uppercase tracking-widest">
              L-ZONE: LOCKED
            </div>

            {/* Launch button */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-1">
                LAUNCH SIMULATOR INTERFACE IN A NEW PAGE
              </p>
              
              <button
                onClick={launchSimulator}
                className="px-8 py-3.5 bg-cyan-glow/10 border border-cyan-glow text-cyan-glow hover:bg-cyan-glow hover:text-space-black text-xs font-orbitron font-extrabold tracking-widest rounded transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] cursor-pointer hover:scale-105 active:scale-95"
              >
                [ INITIATE MISSION SIMULATOR ]
              </button>

              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mt-2">
                HINTS: [A/D] TO ROTATE // [SPACE/W] TO THRUST
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
