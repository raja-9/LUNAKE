import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { Play, RotateCcw, Volume2, VolumeX, AlertTriangle } from 'lucide-react'

// Game Parameters
const GRAVITY = 0.015
const THRUST = 0.04
const ROTATION_SPEED = 0.04
const SAFE_LANDING_SPEED_Y = 1.0
const SAFE_LANDING_ANGLE = 0.15 // approx 8 degrees in radians
const SAFE_LANDING_SPEED_X = 0.4

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export default function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Game states
  const [isPlaying, setIsPlaying] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('lander_highscore') || '0')
  })
  
  // HUD states (synced from loop to React for non-canvas overlay text)
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'FLIGHT' | 'LANDED' | 'CRASHED'>('IDLE')
  const [hudFuel, setHudFuel] = useState(100)
  const [hudVx, setHudVx] = useState(0)
  const [hudVy, setHudVy] = useState(0)
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
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (_) {
      // Audio failed to play or suspended
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
      filter.frequency.value = 400
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start()
    } catch (_) {
      // Noise synthesis error
    }
  }, [soundEnabled])

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
      keysPressed.current[e.key] = true
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false
    };

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Main Canvas & Physics Game Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    
    // Lander coordinates and speeds
    let x = canvas.width / 2
    let y = 60
    let vx = 1.0
    let vy = 0.2
    let angle = -Math.PI / 4 // Start slightly angled for realism
    let fuel = 100
    let landerStatus: 'FLIGHT' | 'LANDED' | 'CRASHED' = 'FLIGHT'
    let particles: Particle[] = []

    // Terrain generation
    const terrainPoints: { x: number; y: number }[] = []
    const generateTerrain = () => {
      terrainPoints.length = 0
      const segments = 24
      const segmentWidth = canvas.width / segments
      const padStartIndex = 10
      const padEndIndex = 12
      const padY = canvas.height - 70

      for (let i = 0; i <= segments; i++) {
        const curX = i * segmentWidth
        let curY = canvas.height - (40 + Math.random() * 80)
        
        // Flatten landing pad area
        if (i >= padStartIndex && i <= padEndIndex) {
          curY = padY
        }
        terrainPoints.push({ x: curX, y: curY })
      }
    }
    generateTerrain()

    // Lander bounding box check
    const checkCollision = () => {
      // Check boundaries
      if (x < 0 || x > canvas.width) return 'CRASHED'
      if (y < 0) return 'FLIGHT'

      // Find segment lander is currently over
      for (let i = 0; i < terrainPoints.length - 1; i++) {
        const p1 = terrainPoints[i]
        const p2 = terrainPoints[i + 1]

        if (x >= p1.x && x <= p2.x) {
          // Interpolate height at exactly X
          const ratio = (x - p1.x) / (p2.x - p1.x)
          const groundY = p1.y + ratio * (p2.y - p1.y)

          // Lander altitude height buffer (approx 15px clearance)
          if (y >= groundY - 14) {
            // Check if on Landing Pad (segments index 10 to 12)
            const isOnPad = i >= 10 && i < 12
            const isSafeVy = vy <= SAFE_LANDING_SPEED_Y
            const isSafeVx = Math.abs(vx) <= SAFE_LANDING_SPEED_X
            const isSafeAngle = Math.abs(angle) <= SAFE_LANDING_ANGLE

            if (isOnPad && isSafeVy && isSafeVx && isSafeAngle) {
              return 'LANDED'
            } else {
              return 'CRASHED'
            }
          }
        }
      }
      return 'FLIGHT'
    }

    // Physics Update and Canvas Paint
    const update = () => {
      if (landerStatus === 'FLIGHT') {
        // Controls
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          angle -= ROTATION_SPEED
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          angle += ROTATION_SPEED
        }

        const isThrusting = keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current[' ']
        if (isThrusting && fuel > 0) {
          // Calculate thrust acceleration vectors
          const ax = Math.sin(angle) * THRUST
          const ay = -Math.cos(angle) * THRUST
          vx += ax
          vy += ay + GRAVITY
          fuel = Math.max(0, fuel - 0.25)
          
          // Spawn thruster flare particles
          for (let p = 0; p < 3; p++) {
            particles.push({
              x: x - Math.sin(angle) * 14,
              y: y + Math.cos(angle) * 14,
              vx: -Math.sin(angle) * 2 + (Math.random() - 0.5),
              vy: Math.cos(angle) * 2 + (Math.random() - 0.5) + 1,
              life: 0,
              maxLife: Math.random() * 20 + 10,
            })
          }
          if (Math.random() < 0.3) {
            playNoise(0.08)
          }
        } else {
          // Normal gravity fall
          vy += GRAVITY
        }

        // Apply motion
        x += vx
        y += vy

        // Check collision
        const nextStatus = checkCollision()
        if (nextStatus !== 'FLIGHT') {
          landerStatus = nextStatus
          setGameStatus(nextStatus)
          
          if (landerStatus === 'LANDED') {
            // Victory Beeps
            playBeep(440, 0.1)
            setTimeout(() => playBeep(554, 0.1), 100)
            setTimeout(() => playBeep(659, 0.1), 200)
            setTimeout(() => playBeep(880, 0.3), 300)
            
            // Landing Score Calculation
            const landingScore = Math.round(fuel * 10 + 500)
            setScore(landingScore)
            if (landingScore > highScore) {
              setHighScore(landingScore)
              localStorage.setItem('lander_highscore', String(landingScore))
            }
            
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#00f0ff', '#ffffff', '#0088ff']
            })
          } else if (landerStatus === 'CRASHED') {
            // Explode Lander
            playBeep(120, 0.5, 'triangle')
            for (let e = 0; e < 50; e++) {
              particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                life: 0,
                maxLife: Math.random() * 40 + 20,
              })
            }
          }
        }
      }

      // Sync state variables to React state
      setHudFuel(Math.round(fuel))
      setHudVx(vx)
      setHudVy(vy)

      // Canvas Render
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Draw Starfield twinkler
      ctx.fillStyle = '#030306'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 2. Draw Vector Terrain
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(terrainPoints[0].x, terrainPoints[0].y)
      for (let i = 1; i < terrainPoints.length; i++) {
        ctx.lineTo(terrainPoints[i].x, terrainPoints[i].y)
      }
      ctx.stroke()

      // Fill terrain structure subtly
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'
      ctx.fill()

      // 3. Highlight Landing Pad
      ctx.strokeStyle = '#00f0ff'
      ctx.lineWidth = 3.5
      ctx.beginPath()
      // pad is from segment index 10 to 12
      const padStart = terrainPoints[10]
      const padEnd = terrainPoints[12]
      ctx.moveTo(padStart.x, padStart.y)
      ctx.lineTo(padEnd.x, padEnd.y)
      ctx.stroke()
      
      // Draw landing pad text overlay
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)'
      ctx.font = 'bold 9px Orbitron'
      ctx.textAlign = 'center'
      ctx.fillText('L-PAD 01', (padStart.x + padEnd.x) / 2, padStart.y + 15)

      // 4. Update and Draw Particles
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
          ? `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${opacity})` // Explosion colors
          : `rgba(0, 240, 255, ${opacity})` // Thruster flame
        ctx.beginPath()
        ctx.arc(p.x, p.y, landerStatus === 'CRASHED' ? 2 : 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // 5. Draw Lunar Lander Module (as vector art)
      if (landerStatus !== 'CRASHED') {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)

        // Draw Lander Body
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.fillStyle = '#06060c'
        ctx.beginPath()
        
        // Hexagonal pod capsule
        ctx.moveTo(-10, -5)
        ctx.lineTo(-6, -12)
        ctx.lineTo(6, -12)
        ctx.lineTo(10, -5)
        ctx.lineTo(10, 2)
        ctx.lineTo(6, 6)
        ctx.lineTo(-6, 6)
        ctx.lineTo(-10, 2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Draw window
        ctx.strokeStyle = '#00f0ff'
        ctx.strokeRect(-4, -8, 8, 4)

        // Draw legs and shock pads
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.2
        
        // Left Leg
        ctx.beginPath()
        ctx.moveTo(-8, 4)
        ctx.lineTo(-14, 12)
        ctx.moveTo(-14, 12)
        ctx.lineTo(-16, 12)
        ctx.lineTo(-12, 12)
        ctx.stroke()

        // Right Leg
        ctx.beginPath()
        ctx.moveTo(8, 4)
        ctx.lineTo(14, 12)
        ctx.moveTo(14, 12)
        ctx.lineTo(16, 12)
        ctx.lineTo(12, 12)
        ctx.stroke()

        // Draw thruster nozzle at base
        ctx.fillStyle = '#64748b'
        ctx.beginPath()
        ctx.moveTo(-3, 6)
        ctx.lineTo(3, 6)
        ctx.lineTo(2, 9)
        ctx.lineTo(-2, 9)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }

      // Keep animation looping
      if (isPlaying && landerStatus === 'FLIGHT') {
        animationId = requestAnimationFrame(update)
      } else {
        // Redraw static screen once when finished
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
  }, [isPlaying, playBeep, playNoise, highScore])

  const startGame = () => {
    setIsPlaying(true)
    setGameStatus('FLIGHT')
    setScore(0)
    
    // Initialize Audio
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    playBeep(600, 0.15)
  }

  // Virtual buttons for mobile controls
  const handleTouchStart = (key: string) => {
    keysPressed.current[key] = true
  }
  const handleTouchEnd = (key: string) => {
    keysPressed.current[key] = false
  }

  // Speed statuses
  const isVxWarning = Math.abs(hudVx) > SAFE_LANDING_SPEED_X
  const isVyWarning = hudVy > SAFE_LANDING_SPEED_Y

  return (
    <section id="game" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 overflow-hidden">
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20" />

      <div className="w-full max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center gap-6">
        
        {/* Game Title */}
        <div className="text-center space-y-2">
          <h2 className="text-xs tracking-widest text-cyan-glow font-orbitron uppercase font-bold text-glow-cyan">
            [ SECTION_03 // LUNAR_LANDING ]
          </h2>
          <h3 className="text-3xl font-extrabold font-orbitron text-white">
            MISSION COMPASS: APOLLO FLIGHT
          </h3>
        </div>

        {/* Game Container */}
        <div ref={containerRef} className="w-full relative hud-panel border-glow-cyan rounded-md overflow-hidden bg-space-black max-w-2xl shadow-xl flex flex-col">
          
          {/* HUD Status Header */}
          <div className="flex items-center justify-between border-b border-hud-border px-4 py-2 text-[10px] font-mono tracking-widest text-gray-500 bg-space-black/80">
            <div className="flex items-center gap-6">
              <div>
                FUEL:{' '}
                <span className={`font-bold ${hudFuel < 25 ? 'text-red-500 animate-pulse' : 'text-cyan-glow'}`}>
                  {hudFuel}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                VX:{' '}
                <span className={isVxWarning ? 'text-red-400' : 'text-green-400'}>
                  {hudVx.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                VY:{' '}
                <span className={isVyWarning ? 'text-red-400' : 'text-green-400'}>
                  {hudVy.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>HIGH_SCORE: {highScore}</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-gray-500 hover:text-cyan-glow cursor-pointer transition-colors p-0.5"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Core Game Canvas */}
          <canvas
            ref={canvasRef}
            width={600}
            height={320}
            className="w-full block border-b border-hud-border/40"
          />

          {/* Dynamic Game Overlay Panels */}
          {gameStatus === 'IDLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/90 p-6 text-center select-none z-10">
              <h4 className="font-orbitron font-bold text-white tracking-widest mb-2 text-glow-cyan text-sm md:text-base">
                LANDING SEQUENCE INITIALIZATION
              </h4>
              <p className="text-[11px] text-gray-400 font-sans leading-relaxed max-w-sm mb-6 uppercase tracking-wider">
                Utilize Thrusters to land carefully on the cyan landing pad. Ensure your vertical descent speed, sideways velocity, and attitude angle are safe.
              </p>
              
              {/* Keyboard Instructions */}
              <div className="hidden md:grid grid-cols-3 gap-6 font-mono text-[9px] text-gray-500 mb-6 uppercase tracking-wider">
                <div>[ A / D ]<br />ATTITUDE ROTATE</div>
                <div>[ SPACE / W ]<br />ENGAGE THRUSTER</div>
                <div>[ ALTITUDE ]<br />WATCH LIGHT DESCENT</div>
              </div>

              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-glow/10 border border-cyan-glow text-cyan-glow hover:bg-cyan-glow hover:text-space-black text-xs font-orbitron font-semibold tracking-widest rounded transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
              >
                START PILOT INTERFACE
              </button>
            </div>
          )}

          {gameStatus === 'LANDED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/95 p-6 text-center z-10 animate-cyber-flicker">
              <h4 className="font-orbitron font-black text-cyan-glow text-xl tracking-widest mb-1 text-glow-cyan">
                SAFE LANDING!
              </h4>
              <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-4">
                PILOT PERFORMANCE: EXCELLENT // SCORE: {score}
              </div>
              <button
                onClick={startGame}
                className="px-5 py-2 border border-cyan-glow text-cyan-glow text-[10px] font-orbitron tracking-widest rounded hover:bg-cyan-glow hover:text-space-black transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RE-START FLIGHT
              </button>
            </div>
          )}

          {gameStatus === 'CRASHED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-black/95 p-6 text-center z-10 animate-cyber-flicker">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-2 animate-bounce" />
              <h4 className="font-orbitron font-black text-red-500 text-lg tracking-widest mb-1">
                CAPSULE DESTROYED
              </h4>
              <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-6">
                CRITICAL WARNING: DESCENT EXCEEDED STRUCTURE INTEGRITY
              </div>
              <button
                onClick={startGame}
                className="px-5 py-2 border border-red-500 text-red-500 text-[10px] font-orbitron tracking-widest rounded hover:bg-red-500 hover:text-space-black transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RE-START FLIGHT
              </button>
            </div>
          )}

          {/* Virtual Mobile Controllers */}
          <div className="flex md:hidden items-center justify-between border-t border-hud-border/40 p-4 bg-space-black/60 z-10">
            <div className="flex gap-4">
              <button
                onTouchStart={() => handleTouchStart('ArrowLeft')}
                onTouchEnd={() => handleTouchEnd('ArrowLeft')}
                className="w-12 h-12 rounded border border-hud-border active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-mono font-bold tracking-widest uppercase text-cyan-glow"
              >
                L
              </button>
              <button
                onTouchStart={() => handleTouchStart('ArrowRight')}
                onTouchEnd={() => handleTouchEnd('ArrowRight')}
                className="w-12 h-12 rounded border border-hud-border active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-mono font-bold tracking-widest uppercase text-cyan-glow"
              >
                R
              </button>
            </div>
            <button
              onTouchStart={() => handleTouchStart('ArrowUp')}
              onTouchEnd={() => handleTouchEnd('ArrowUp')}
              className="w-24 h-12 rounded border border-cyan-glow active:bg-cyan-glow active:text-space-black flex items-center justify-center text-xs font-orbitron font-bold tracking-widest uppercase text-cyan-glow"
            >
              THRUST
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}
