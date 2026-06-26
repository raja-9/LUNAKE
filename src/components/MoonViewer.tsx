import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Info, X, Zap, ChevronLeft, ChevronRight, Play, Pause, RefreshCw } from 'lucide-react'

// Convert Lat/Lon to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  // Map to 3D space
  const x = -(radius * Math.sin(phi) * Math.sin(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.cos(theta)

  return [x, y, z]
}

interface Hotspot {
  id: string
  name: string
  lat: number
  lon: number
  fact: string
}

const MOON_HOTSPOTS: Hotspot[] = [
  {
    id: 'apollo11',
    name: 'Apollo 11 Landing Site',
    lat: 0.67408,
    lon: 23.47297,
    fact: 'First manned landing site on the Moon (July 20, 1969). Neil Armstrong and Buzz Aldrin walked here in Mare Tranquillitatis (Sea of Tranquility).'
  },
  {
    id: 'tycho',
    name: 'Tycho Crater',
    lat: -43.31,
    lon: -11.36,
    fact: 'A prominent 85km wide impact crater in the southern highlands. Famous for its bright ray system of ejected material extending thousands of kilometers.'
  },
  {
    id: 'copernicus',
    name: 'Copernicus Crater',
    lat: 9.62,
    lon: -20.08,
    fact: 'One of the most famous lunar craters. Located in Mare Imbrium, it is roughly 93km wide with high terraced walls and a complex central peak.'
  }
]

const LUNAR_STATS = [
  { label: 'DIAMETER', value: '3,474 KM' },
  { label: 'GRAVITY', value: '1.62 M/S² (0.17G)' },
  { label: 'ORBIT_PERIOD', value: '27.3 DAYS' },
  { label: 'MEAN_TEMP', value: '-130°C TO +120°C' }
]

// Animated Moon Sphere Component
interface MoonProps {
  onSelectHotspot: (h: Hotspot) => void
  activeHotspotId: string | null
  autoRotate: boolean
  moonRef: React.RefObject<THREE.Mesh | null>
}

function Moon({ onSelectHotspot, activeHotspotId, autoRotate, moonRef }: MoonProps) {
  // Load textures
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    '/textures/moonmap1k.jpg',
    '/textures/moonbump1k.jpg'
  ])

  // Configure textures
  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace
  }, [colorMap])

  // Slow automatic rotation
  useFrame((_, delta) => {
    if (moonRef.current && autoRotate && !activeHotspotId) {
      moonRef.current.rotation.y += delta * 0.05
    }
  })

  const radius = 2.2

  return (
    <group>
      <mesh ref={moonRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.04}
          roughness={0.9}
          metalness={0.1}
        />

        {/* Render Hotspots relative to the Moon's rotation */}
        {MOON_HOTSPOTS.map((hotspot) => {
          const position = latLonToVector3(hotspot.lat, hotspot.lon, radius + 0.05)
          const isActive = activeHotspotId === hotspot.id

          return (
            <group key={hotspot.id} position={position}>
              <Html distanceFactor={6} center>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectHotspot(hotspot)
                  }}
                  className={`group relative flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-glow scale-110 shadow-[0_0_12px_#00f0ff]'
                      : 'bg-space-black border border-cyan-glow hover:bg-cyan-glow/20'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-space-black' : 'text-cyan-glow'}`} />

                  {/* Outer pulse */}
                  <span className={`absolute inset-0 rounded-full border border-cyan-glow animate-ping pointer-events-none opacity-40 ${isActive ? 'inline-flex' : 'hidden group-hover:inline-flex'}`} />
                </button>
              </Html>
            </group>
          )
        })}
      </mesh>
    </group>
  )
}

export default function MoonViewer() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const moonRef = useRef<THREE.Mesh>(null)

  // Track responsive screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cycle through hotspots (Next / Prev)
  const handleCycleHotspot = (direction: 'next' | 'prev') => {
    if (!selectedHotspot) {
      setSelectedHotspot(MOON_HOTSPOTS[0])
      return
    }
    const currentIndex = MOON_HOTSPOTS.findIndex((h) => h.id === selectedHotspot.id)
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1

    if (nextIndex >= MOON_HOTSPOTS.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = MOON_HOTSPOTS.length - 1

    setSelectedHotspot(MOON_HOTSPOTS[nextIndex])
  }

  // Reset rotation and deselect site
  const handleReset = () => {
    setSelectedHotspot(null)
    setAutoRotate(true)
    if (moonRef.current) {
      moonRef.current.rotation.set(0, 0, 0)
    }
  }

  return (
    <section id="viewer" className="relative w-full h-screen overflow-hidden bg-space-black flex flex-col justify-between select-none">
      {/* Sci-fi HUD overlay grid */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20 z-1" />

      {/* R3F Canvas Container */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Canvas
          camera={{ position: [0, 0, isMobile ? 6 : 5], fov: 45 }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Ambient deep space fill */}
          <ambientLight intensity={0.15} />

          {/* Direct Sun light source */}
          <directionalLight
            position={[10, 5, 5]}
            intensity={2.5}
            color="#ffffff"
          />

          {/* Subtle backlight for glowing edge rim effect */}
          <pointLight
            position={[-5, 0, -5]}
            intensity={0.8}
            color="#00f0ff"
          />

          <Moon
            onSelectHotspot={(hotspot) => setSelectedHotspot(hotspot)}
            activeHotspotId={selectedHotspot ? selectedHotspot.id : null}
            autoRotate={autoRotate}
            moonRef={moonRef}
          />

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3.5}
            maxDistance={7}
            makeDefault
          />
        </Canvas>
      </div>

      {/* Floating HUD Overlays (z-10, pointer-events-none so click-through works, select elements have pointer-events-auto) */}
      <div className="absolute inset-0 pointer-events-none z-10 p-6 pt-24 md:p-12 md:pt-24 flex flex-col justify-between w-full h-full">
        
        {/* Top Section */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Title Panel */}
          <div className="pointer-events-auto hud-panel p-4 max-w-xs border-glow-cyan">
            <div className="text-[9px] text-cyan-glow tracking-widest font-orbitron uppercase">
              // SYS_ORBITAL_VISUALIZER
            </div>
            <h2 className="text-base font-black font-orbitron text-white mt-1 uppercase tracking-wide">
              Luna Telemetry Visualizer
            </h2>
            <p className="text-[9px] text-gray-500 font-mono mt-1.5 leading-relaxed uppercase">
              Target: SELENE (LUNA) <br />
              Status: Render active // Hotspots synced
            </p>
          </div>

          {/* Right Information HUD Panel */}
          <div className="pointer-events-auto w-full md:max-w-sm">
            {selectedHotspot ? (
              <div className="hud-panel p-5 border-glow-cyan-active animate-cyber-flicker">
                <div className="flex justify-between items-center border-b border-hud-border pb-2 mb-2">
                  <h3 className="font-orbitron font-bold text-xs tracking-wider text-cyan-glow uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> {selectedHotspot.name}
                  </h3>
                  <button
                    onClick={() => setSelectedHotspot(null)}
                    className="text-gray-500 hover:text-cyan-glow p-0.5 rounded cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 mb-2 font-mono uppercase">
                  LAT: {selectedHotspot.lat.toFixed(4)}° | LON: {selectedHotspot.lon.toFixed(4)}°
                </p>
                <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                  {selectedHotspot.fact}
                </p>
              </div>
            ) : (
              <div className="hud-panel p-5 border-glow-cyan">
                <div className="border-b border-hud-border pb-2 mb-2">
                  <h3 className="font-orbitron font-bold text-xs tracking-wider text-gray-400 uppercase">
                    LUNAR PHYSICAL STATS
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
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full flex flex-col-reverse md:flex-row justify-between items-end gap-6">
          {/* Interactive Console Controls */}
          <div className="pointer-events-auto flex items-center gap-3 hud-panel p-2.5 border-glow-cyan bg-space-black/90">
            {/* Auto Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
              className={`p-2 rounded border transition-all duration-300 cursor-pointer ${
                autoRotate
                  ? 'border-cyan-glow text-cyan-glow bg-cyan-glow/10 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'border-hud-border text-gray-400 hover:text-cyan-glow hover:border-cyan-glow'
              }`}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Prev/Next Hotspot */}
            <div className="flex items-center border-l border-r border-hud-border px-2 gap-1.5">
              <button
                onClick={() => handleCycleHotspot('prev')}
                title="Previous Hotspot"
                className="p-1.5 rounded border border-hud-border hover:border-cyan-glow hover:text-cyan-glow text-gray-400 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[9px] font-orbitron text-gray-400 uppercase tracking-wider px-1">
                CYCLE SITES
              </span>
              <button
                onClick={() => handleCycleHotspot('next')}
                title="Next Hotspot"
                className="p-1.5 rounded border border-hud-border hover:border-cyan-glow hover:text-cyan-glow text-gray-400 cursor-pointer transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset System"
              className="p-2 rounded border border-hud-border hover:border-cyan-glow hover:text-cyan-glow hover:shadow-[0_0_8px_rgba(0,240,255,0.2)] text-gray-400 cursor-pointer transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Instruction HUD Overlay */}
          <div className="text-[9px] text-gray-500 tracking-widest font-orbitron uppercase select-none pointer-events-none text-right">
            DRAG TO ROTATE // SCROLL TO ZOOM
          </div>
        </div>

      </div>
    </section>
  )
}
