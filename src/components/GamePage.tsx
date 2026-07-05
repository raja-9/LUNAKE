import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { RotateCcw, Volume2, VolumeX, AlertTriangle, ArrowLeft, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'

// Game Parameters (Improved & Forgiving)
const GRAVITY = 0.012 // slightly lower gravity for easier control
const THRUST = 0.035
const ROTATION_SPEED = 0.035
const SAFE_LANDING_SPEED_Y = 1.4  // Increased from 1.0
const SAFE_LANDING_SPEED_X = 0.8  // Increased from 0.4
const SAFE_LANDING_ANGLE = 0.28    // approx 16 degrees, increased from 0.15 (8.6 deg)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Game states
  const [isPlaying, setIsPlaying] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [resetCounter, setResetCounter] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('lander_highscore') || '0')
  })
  
  // HUD states (synced from loop to React for sidebar display)
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'FLIGHT' | 'LANDED' | 'CRASHED'>('IDLE')
  const [hudFuel, setHudFuel] = useState(100)
  const [hudVx, setHudVx] = useState(0)
  const [hudVy, setHudVy] = useState(0)
  const [hudAngle, setHudAngle] = useState(0) // Angle in degrees
  const [hudOnPad, setHudOnPad] = useState(false)
  const [score, setScore] = useState(0)

  // Track keypresses
  const keysPressed = useRef<{ [key: string]: boolean }>({})

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Sound Synthesizers
  const playBeep = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (_) {
      // Audio failed
    }
  }, [soundEnabled])

  // Play thruster sound (white noise)
  const playNoise = useCallback((duration: number) => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 350
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start()
    } catch (_) {
      // Audio failed
    }
  }, [soundEnabled])

  // Keyboard inputs listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'a', 'd', 'w', ' '].includes(e.key)) {
        e.preventDefault()
      }
      keysPressed.current[e.key.toLowerCase()] = true
      keysPressed.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
      keysPressed.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Main Canvas & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    
    // Lander initial coordinates and speeds
    let x = canvas.width / 2
    let y = 65
    let vx = (Math.random() * 1.2 - 0.6) // randomized horizontal initial velocity
    let vy = 0.2
    let angle = (Math.random() * 0.4 - 0.2) // slight random angle for fun
    let fuel = 100
    let landerStatus: 'FLIGHT' | 'LANDED' | 'CRASHED' = 'FLIGHT'
    let particles: Particle[] = []

    // Terrain generation with wider Landing Pad in the center (Indices 9 to 14 = 125px flat width!)
    const terrainPoints: { x: number; y: number }[] = []
    const generateTerrain = () => {
      terrainPoints.length = 0
      const segments = 24
      const segmentWidth = canvas.width / segments
      const padStartIndex = 9
      const padEndIndex = 14
      const padY = canvas.height - 70

      for (let i = 0; i <= segments; i++) {
        const curX = i * segmentWidth
        let curY = canvas.height - (40 + Math.random() * 60)
        
        // Flatten landing pad area
        if (i >= padStartIndex && i <= padEndIndex) {
          curY = padY
        }
        terrainPoints.push({ x: curX, y: curY })
      }
    }
    generateTerrain()

    // Bounding check
    const checkCollision = () => {
      // Off sides bounds check
      if (x < 10 || x > canvas.width - 10) return 'CRASHED'
      if (y < 0) return 'FLIGHT'

      // Find the terrain segment the lander is over
      for (let i = 0; i < terrainPoints.length - 1; i++) {
        const p1 = terrainPoints[i]
        const p2 = terrainPoints[i + 1]

        if (x >= p1.x && x <= p2.x) {
          const ratio = (x - p1.x) / (p2.x - p1.x)
          const groundY = p1.y + ratio * (p2.y - p1.y)

          // Lander feet clearance check (approx 12px)
          if (y >= groundY - 12) {
            // Check if on Landing Pad (segments index 9 to 14)
            const isOnPad = i >= 9 && i < 14
            const isSafeVy = vy <= SAFE_LANDING_SPEED_Y
            const isSafeVx = Math.abs(vx) <= SAFE_LANDING_SPEED_X
            const isSafeAngle = Math.abs(angle) <= SAFE_LANDING_ANGLE

            if (isOnPad && isSafeVy && isSafeVx && isSafeAngle) {
              // Level the lander, center it on landing surface, stop movements
              y = groundY - 12
              angle = 0
              vx = 0
              vy = 0
              return 'LANDED'
            } else {
              return 'CRASHED'
            }
          }
        }
      }
      return 'FLIGHT'
    }

    // Animation frames update
    const update = () => {
      if (landerStatus === 'FLIGHT') {
        // Controls rotation
        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
          angle -= ROTATION_SPEED
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
          angle += ROTATION_SPEED
        }

        // Thrust
        const isThrusting = keysPressed.current['arrowup'] || keysPressed.current['w'] || keysPressed.current[' ']
        if (isThrusting && fuel > 0) {
          const ax = Math.sin(angle) * THRUST
          const ay = -Math.cos(angle) * THRUST
          vx += ax
          vy += ay + GRAVITY
          fuel = Math.max(0, fuel - 0.22)
          
          // Flame Particles
          for (let p = 0; p < 2; p++) {
            particles.push({
              x: x - Math.sin(angle) * 12,
              y: y + Math.cos(angle) * 12,
              vx: -Math.sin(angle) * 2.2 + (Math.random() - 0.5),
              vy: Math.cos(angle) * 2.2 + (Math.random() - 0.5) + 0.8,
              life: 0,
              maxLife: Math.random() * 15 + 8,
            })
          }
          if (Math.random() < 0.25) {
            playNoise(0.06)
          }
        } else {
          // Normal Gravity
          vy += GRAVITY
        }

        // Apply velocities
        x += vx
        y += vy

        // Check if current X is over landing pad (for real-time dashboard indicator)
        const isOverPad = x >= 225 && x <= 350
        setHudOnPad(isOverPad)

        // Collision Checks
        const nextStatus = checkCollision()
        if (nextStatus !== 'FLIGHT') {
          landerStatus = nextStatus
          setGameStatus(nextStatus)
          
          if (landerStatus === 'LANDED') {
            // Success audio sequence
            playBeep(523, 0.08) // C5
            setTimeout(() => playBeep(659, 0.08), 80) // E5
            setTimeout(() => playBeep(784, 0.08), 160) // G5
            setTimeout(() => playBeep(1046, 0.25), 240) // C6
            
            // Score tracking
            const landingScore = Math.round(fuel * 12 + 600)
            setScore(landingScore)
            if (landingScore > highScore) {
              setHighScore(landingScore)
              localStorage.setItem('lander_highscore', String(landingScore))
            }
            
            confetti({
              particleCount: 130,
              spread: 75,
              origin: { y: 0.65 },
              colors: ['#00f0ff', '#ffffff', '#00ff88']
            })
          } else if (landerStatus === 'CRASHED') {
            // Explosion sound & debris particles
            playBeep(90, 0.6, 'sawtooth')
            for (let e = 0; e < 60; e++) {
              particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7 - 1.5,
                life: 0,
                maxLife: Math.random() * 35 + 20,
              })
            }
          }
        }
      }

      // Sync variables to telemetry state
      setHudFuel(Math.round(fuel))
      setHudVx(vx)
      setHudVy(vy)
      setHudAngle(Math.round(angle * (180 / Math.PI))) // Convert to degrees

      // Render Graphics
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Draw Starfield background
      ctx.fillStyle = '#010103'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw subtle horizon glow grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }

      // 2. Draw Vector Terrain
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(terrainPoints[0].x, terrainPoints[0].y)
      for (let i = 1; i < terrainPoints.length; i++) {
        ctx.lineTo(terrainPoints[i].x, terrainPoints[i].y)
      }
      ctx.stroke()

      // Fill ground under terrain
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
      ctx.fill()

      // 3. Highlight Landing Pad (Width: 225px to 350px)
      ctx.strokeStyle = '#00f0ff'
      ctx.lineWidth = 4
      ctx.beginPath()
      const padStart = terrainPoints[9]
      const padEnd = terrainPoints[14]
      ctx.moveTo(padStart.x, padStart.y)
      ctx.lineTo(padEnd.x, padEnd.y)
      ctx.stroke()
      
      // Draw landing pad overlay label
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)'
      ctx.font = 'bold 10px Orbitron'
      ctx.textAlign = 'center'
      ctx.fillText('SAFE DESCENT ZONE', (padStart.x + padEnd.x) / 2, padStart.y + 18)

      // 4. Particle Flares
      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        if (p.life >= p.maxLife) {
          particles.splice(index, 1)
          return
        }

        const opacity = 1 - p.life / p.maxLife
        ctx.fillStyle = landerStatus === 'CRASHED'
          ? `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${opacity})`
          : `rgba(0, 240, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, landerStatus === 'CRASHED' ? 2.5 : 1.6, 0, Math.PI * 2)
        ctx.fill()
      })

      // 5. Lunar Lander Module
      if (landerStatus !== 'CRASHED') {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)

        // Lander body pod
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.6
        ctx.fillStyle = '#06060c'
        ctx.beginPath()
        ctx.moveTo(-11, -5)
        ctx.lineTo(-7, -13)
        ctx.lineTo(7, -13)
        ctx.lineTo(11, -5)
        ctx.lineTo(11, 2)
        ctx.lineTo(7, 7)
        ctx.lineTo(-7, 7)
        ctx.lineTo(-11, 2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Cockpit window
        ctx.strokeStyle = '#00f0ff'
        ctx.strokeRect(-4, -9, 8, 4)

        // Left Leg & shock absorber pad
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(-8, 5)
        ctx.lineTo(-15, 12)
        ctx.moveTo(-17, 12)
        ctx.lineTo(-13, 12)
        ctx.stroke()

        // Right Leg & shock absorber pad
        ctx.beginPath()
        ctx.moveTo(8, 5)
        ctx.lineTo(15, 12)
        ctx.moveTo(17, 12)
        ctx.lineTo(13, 12)
        ctx.stroke()

        // Thruster nozzle
        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.moveTo(-3.5, 7)
        ctx.lineTo(3.5, 7)
        ctx.lineTo(2, 10)
        ctx.lineTo(-2, 10)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }

      // Loop continues if flight is in action
      if (isPlaying && landerStatus === 'FLIGHT') {
        animationId = requestAnimationFrame(update)
      } else {
        cancelAnimationFrame(animationId)
      }
    }

    if (isPlaying) {
      setGameStatus('FLIGHT')
      animationId = requestAnimationFrame(update)
    }

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isPlaying, resetCounter, playBeep, playNoise, highScore])

  const startGame = () => {
    setIsPlaying(true)
    setGameStatus('FLIGHT')
    setScore(0)
    setResetCounter(prev => prev + 1)
    
    // Audio init
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    playBeep(640, 0.15)
  }

  // Mobile virtual touch buttons
  const handleTouchStart = (key: string) => {
    keysPressed.current[key.toLowerCase()] = true
    keysPressed.current[key] = true
  }
  
  const handleTouchEnd = (key: string) => {
    keysPressed.current[key.toLowerCase()] = false
    keysPressed.current[key] = false
  }

  // Telemetry status warnings
  const isVxWarning = Math.abs(hudVx) > SAFE_LANDING_SPEED_X
  const isVyWarning = hudVy > SAFE_LANDING_SPEED_Y
  const isAngleWarning = Math.abs(hudAngle) > (SAFE_LANDING_ANGLE * (180 / Math.PI))

  return (
    <div className="w-screen h-screen bg-space-black text-slate-200 relative overflow-hidden flex flex-col justify-between font-sans selection:bg-cyan-glow/20 selection:text-cyan-glow">
      {/* HUD scanline grid */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20 z-0" />
      <div className="scanline-overlay" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-hud-border/40 bg-space-black/90 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.location.hash = ''
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-hud-border hover:border-cyan-glow hover:text-cyan-glow text-xs font-orbitron font-semibold tracking-wider rounded transition-all cursor-pointer bg-space-black/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> COMMAND CENTER
          </button>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            <span>[ MISSION SIMULATOR: ORBITAL_LANDER ]</span>
          </div>
        </div>

        {/* Center Live Pilot status */}
        <div className="text-center font-orbitron text-[10px] md:text-xs font-bold tracking-widest text-glow-cyan text-cyan-glow animate-pulse-slow">
          [ PILOT INTERFACE: ONLINE // ENGAGED ]
        </div>

        {/* Right audio controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-gray-400 hover:text-cyan-glow cursor-pointer transition-colors p-1.5 border border-hud-border/40 rounded bg-space-black/50"
            title="Toggle Simulator Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch overflow-hidden">
        
        {/* Left Telemetry Sidebar Panel */}
        <div className="hud-panel p-5 border-glow-cyan flex flex-col justify-between bg-space-black/80 lg:col-span-1">
          <div className="space-y-6">
            <div>
              <div className="text-[9px] text-cyan-glow font-orbitron tracking-widest uppercase mb-1">// PROPULSION_RESERVE</div>
              <h3 className="text-lg font-orbitron font-bold text-white uppercase">FUEL REMAINING</h3>
              <div className="relative w-full h-4 bg-space-black border border-hud-border rounded overflow-hidden mt-2">
                <div 
                  className={`h-full transition-all duration-100 ${hudFuel < 25 ? 'bg-red-600 animate-pulse' : 'bg-cyan-glow'}`}
                  style={{ width: `${hudFuel}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white">
                  {hudFuel}%
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1 uppercase">
                <span>0% CRITICAL</span>
                <span>100% NOMINAL</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[9px] text-cyan-glow font-orbitron tracking-widest uppercase border-b border-hud-border pb-1">// DIAL_VECTORS</div>
              
              {/* Descent speed (VY) */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] text-gray-400 uppercase">DESCENT RATE (VY):</span>
                <span className={`text-sm font-bold ${isVyWarning ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                  {hudVy.toFixed(2)} m/s
                </span>
              </div>

              {/* Horizontal speed (VX) */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] text-gray-400 uppercase">LATERAL RATE (VX):</span>
                <span className={`text-sm font-bold ${isVxWarning ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                  {hudVx.toFixed(2)} m/s
                </span>
              </div>

              {/* Attitude (Angle) */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] text-gray-400 uppercase">ATTITUDE TILT:</span>
                <span className={`text-sm font-bold ${isAngleWarning ? 'text-red-500' : 'text-green-400'}`}>
                  {hudAngle}°
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-hud-border/40 pt-4 font-mono text-[9px] text-gray-500 uppercase tracking-widest space-y-1">
            <div>SYSTEM: AP-FLIGHT-V1</div>
            <div>STATION: L-PAD-CENTRAL</div>
            <div>STATUS: TELEMETRY_STREAMING</div>
          </div>
        </div>

        {/* Center Cockpit Game Canvas */}
        <div className="lg:col-span-2 flex flex-col justify-center items-center">
          <div ref={containerRef} className="w-full relative hud-panel border-glow-cyan rounded-md overflow-hidden bg-space-black max-w-3xl shadow-2xl flex flex-col">
            
            {/* Header Mini Info bar */}
            <div className="flex items-center justify-between border-b border-hud-border/40 px-4 py-2 text-[9px] font-mono tracking-widest text-gray-400 bg-space-black/90">
              <div>TARGET_ZONE: LAT 0.67° N</div>
              <div className="flex items-center gap-4">
                <span>ATTEMPT LIMIT: UNLIMITED</span>
                <span className="text-cyan-glow">HIGH SCORE: {highScore}</span>
              </div>
            </div>

            {/* Render Canvas */}
            <canvas
              ref={canvasRef}
              width={720}
              height={380}
              className="w-full block border-b border-hud-border/20 bg-space-black cursor-crosshair"
            />

            {/* Overlays inside Cockpit Screen */}
            {gameStatus === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/95 p-6 text-center select-none z-20">
                <h4 className="font-orbitron font-extrabold text-cyan-glow text-base md:text-lg tracking-widest mb-3 text-glow-cyan">
                  LUNAR PILOT FLIGHT INTERFACE
                </h4>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed max-w-md mb-6 uppercase tracking-wider">
                  Pilot, descend slowly and land the capsule on the cyan zone. Control your descent rate, lateral velocity, and attitude tilt to prevent catastrophic structural failure.
                </p>
                
                {/* Rules */}
                <div className="grid grid-cols-3 gap-4 font-mono text-[9px] text-gray-500 border-t border-b border-hud-border/30 py-3 mb-6 w-full max-w-md uppercase tracking-wider">
                  <div>DESCENT RATE<br /><span className="text-green-400 font-bold">&lt; 1.40 m/s</span></div>
                  <div>LATERAL RATE<br /><span className="text-green-400 font-bold">&lt; 0.80 m/s</span></div>
                  <div>ATTITUDE TILT<br /><span className="text-green-400 font-bold">&lt; 16° RANGE</span></div>
                </div>

                <button
                  onClick={startGame}
                  className="px-6 py-2.5 bg-cyan-glow/10 border border-cyan-glow text-cyan-glow hover:bg-cyan-glow hover:text-space-black text-xs font-orbitron font-semibold tracking-widest rounded transition-all duration-300 shadow-[0_0_12px_rgba(0,240,255,0.25)] cursor-pointer"
                >
                  INITIALIZE FLIGHT ENGINE
                </button>
              </div>
            )}

            {gameStatus === 'LANDED' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/95 p-6 text-center z-20 animate-cyber-flicker">
                <ShieldCheck className="w-12 h-12 text-cyan-glow mb-2 animate-pulse" />
                <h4 className="font-orbitron font-black text-cyan-glow text-2xl tracking-widest mb-1 text-glow-cyan">
                  TOUCHDOWN SUCCESS!
                </h4>
                <p className="text-xs text-green-400 font-mono tracking-widest uppercase mb-4">
                  STRUCTURAL INTEGRITY: 100% // SCORE: {score}
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 border border-cyan-glow text-cyan-glow text-xs font-orbitron tracking-widest rounded hover:bg-cyan-glow hover:text-space-black transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> LAUNCH RETRY
                </button>
              </div>
            )}

            {gameStatus === 'CRASHED' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/95 p-6 text-center z-20 animate-cyber-flicker">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-2 animate-bounce" />
                <h4 className="font-orbitron font-black text-red-500 text-xl tracking-widest mb-1">
                  CRITICAL IMPACT CRASH
                </h4>
                <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-6 max-w-sm">
                  STRUCTURE INTEGRITY COMPROMISED. PARAMETERS EXCEEDED CRITICAL THRESHOLDS.
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 border border-red-500 text-red-500 text-xs font-orbitron tracking-widest rounded hover:bg-red-500 hover:text-space-black transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> INITIALIZE RETRY
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Flight Console Sidebar Panel */}
        <div className="hud-panel p-5 border-glow-cyan flex flex-col justify-between bg-space-black/80 lg:col-span-1">
          <div className="space-y-6">
            <div>
              <div className="text-[9px] text-cyan-glow font-orbitron tracking-widest uppercase mb-1">// SECURITY_CHECKS</div>
              <h3 className="text-lg font-orbitron font-bold text-white uppercase">LANDING PARAMETERS</h3>
            </div>

            {/* Diagnostic checklights */}
            <div className="space-y-3 font-mono text-xs">
              
              {/* Check 1: Descent Rate */}
              <div className="p-3 border border-hud-border/30 rounded bg-space-black/60 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">DESCENT RATE</div>
                  <div className="font-semibold text-slate-300">VY &lt; 1.40 m/s</div>
                </div>
                {gameStatus === 'IDLE' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                ) : isVyWarning ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </div>

              {/* Check 2: Lateral Rate */}
              <div className="p-3 border border-hud-border/30 rounded bg-space-black/60 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">LATERAL RATE</div>
                  <div className="font-semibold text-slate-300">VX &lt; 0.80 m/s</div>
                </div>
                {gameStatus === 'IDLE' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                ) : isVxWarning ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </div>

              {/* Check 3: Tilt */}
              <div className="p-3 border border-hud-border/30 rounded bg-space-black/60 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">ATTITUDE TILT</div>
                  <div className="font-semibold text-slate-300">ROTATION &lt; 16°</div>
                </div>
                {gameStatus === 'IDLE' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                ) : isAngleWarning ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </div>

              {/* Check 4: Pad target */}
              <div className="p-3 border border-hud-border/30 rounded bg-space-black/60 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase">PAD ALIGNMENT</div>
                  <div className="font-semibold text-slate-300">ON PAD VECTOR</div>
                </div>
                {gameStatus === 'IDLE' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                ) : !hudOnPad ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </div>

            </div>
          </div>

          <div className="p-3 border border-cyan-glow/20 rounded bg-cyan-glow/5 text-[10px] font-mono text-cyan-glow leading-relaxed uppercase">
            <span>[ KEYBOARD CONTROLS ]<br /></span>
            <span className="text-gray-400">[A / D]: rotate capsule<br /></span>
            <span className="text-gray-400">[W / SPACE / UP]: thruster impulse</span>
          </div>
        </div>

      </main>

      {/* Footer & Mobile Virtual Controllers */}
      <footer className="relative z-10 w-full border-t border-hud-border/40 py-6 bg-space-black/95">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest text-center md:text-left">
            SIMULATOR COORD: SEA_OF_TRANQUILITY // SHIELDING: ACTIVE
          </div>

          {/* Virtual Mobile Controllers (Visible only on small screens) */}
          <div className="flex md:hidden items-center justify-between w-full max-w-sm mx-auto px-4 py-2 border border-hud-border/20 rounded bg-space-black/80">
            <div className="flex gap-3">
              <button
                onTouchStart={() => handleTouchStart('ArrowLeft')}
                onTouchEnd={() => handleTouchEnd('ArrowLeft')}
                className="w-12 h-12 rounded border border-hud-border active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-mono font-bold text-cyan-glow select-none"
              >
                L
              </button>
              <button
                onTouchStart={() => handleTouchStart('ArrowRight')}
                onTouchEnd={() => handleTouchEnd('ArrowRight')}
                className="w-12 h-12 rounded border border-hud-border active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-mono font-bold text-cyan-glow select-none"
              >
                R
              </button>
            </div>
            <button
              onTouchStart={() => handleTouchStart('ArrowUp')}
              onTouchEnd={() => handleTouchEnd('ArrowUp')}
              className="w-24 h-12 rounded border border-cyan-glow active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-orbitron font-bold text-cyan-glow select-none"
            >
              THRUST
            </button>
          </div>

          <div className="font-mono text-[9px] text-cyan-glow/40 uppercase tracking-widest text-center md:text-right">
            TELEMETRY LINK: SECURE // AP-FLIGHT
          </div>
        </div>
      </footer>
    </div>
  )
}
