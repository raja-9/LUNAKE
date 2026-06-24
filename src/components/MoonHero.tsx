import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Info, X, Zap } from 'lucide-react'

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

// Animated Moon Sphere
function Moon({ 
  onSelectHotspot, 
  activeHotspotId 
}: { 
  onSelectHotspot: (h: Hotspot) => void
  activeHotspotId: string | null 
}) {
  const moonRef = useRef<THREE.Mesh>(null)
  
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
    if (moonRef.current && !activeHotspotId) {
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

export default function MoonHero() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* HUD overlay grid */}
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-40" />

      {/* Main layout container */}
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Bio / Title */}
        <div className="lg:col-span-5 flex flex-col gap-6 text-left order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-glow/5 border border-cyan-glow/15 w-fit text-[10px] tracking-widest text-cyan-glow uppercase font-orbitron">
            <Info className="w-3 h-3" /> System Uplink Active
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-orbitron tracking-tight leading-none text-white">
            EXPLORING THE <br />
            <span className="text-glow-cyan text-cyan-glow">LUNAR FRONTIER</span>
          </h1>

          <p className="text-sm md:text-base text-gray-400 font-light leading-relaxed max-w-md">
            Hi, I'm a Computer Science student developing advanced systems for the next generation of space telemetry. Welcome to my lunar command center.
          </p>

          <div className="flex gap-4 mt-2">
            <a
              href="#info"
              className="px-6 py-3 bg-cyan-glow text-space-black font-orbitron font-semibold text-xs tracking-wider uppercase rounded hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] hover:scale-105 transition-all duration-300"
            >
              Telemetry Data
            </a>
            <a
              href="#game"
              className="px-6 py-3 border border-hud-border text-gray-300 font-orbitron text-xs tracking-wider uppercase rounded hover:border-cyan-glow hover:text-white transition-all duration-300"
            >
              Lander Mission
            </a>
          </div>
        </div>

        {/* Right Column: 3D Scene */}
        <div className="lg:col-span-7 h-[350px] md:h-[500px] w-full relative order-1 lg:order-2">
          {/* Interactive Floating Details Panel */}
          {selectedHotspot && (
            <div className="absolute top-4 left-4 z-20 max-w-xs md:max-w-sm hud-panel p-4 border-glow-cyan-active text-left animate-cyber-flicker">
              <div className="flex justify-between items-center border-b border-hud-border pb-2 mb-2">
                <h3 className="font-orbitron font-bold text-xs tracking-wider text-cyan-glow uppercase">
                  {selectedHotspot.name}
                </h3>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-gray-500 hover:text-cyan-glow p-0.5 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mb-2 font-mono uppercase">
                LAT: {selectedHotspot.lat.toFixed(4)}° | LON: {selectedHotspot.lon.toFixed(4)}°
              </p>
              <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                {selectedHotspot.fact}
              </p>
            </div>
          )}

          {/* R3F Canvas */}
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
            />

            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3.5}
              maxDistance={7}
              makeDefault
            />
          </Canvas>

          {/* User Instructions HUD Overlay */}
          <div className="absolute bottom-4 right-4 text-[9px] text-gray-500 tracking-widest font-orbitron uppercase select-none pointer-events-none">
            DRAG TO ROTATE // SCROLL TO ZOOM
          </div>
        </div>

      </div>
    </section>
  )
}
