import { useState, useEffect } from 'react'
import * as SunCalc from 'suncalc'
import { Compass, Eye, MapPin, Orbit } from 'lucide-react'

// Coordinate Fallback (NASA Kennedy Space Center)
const DEFAULT_COORDS = { lat: 28.57287, lon: -80.64898 }

export default function MoonInfo() {
  const [coords, setCoords] = useState(DEFAULT_COORDS)
  const [usingGeo, setUsingGeo] = useState(false)
  const [isMiles, setIsMiles] = useState(false)
  const [moonData, setMoonData] = useState({
    phaseName: 'LOADING...',
    illumination: 0,
    distance: 384400,
    altitude: 0,
    azimuth: 0,
  })

  // Geolocation detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
          setUsingGeo(true)
        },
        () => {
          // Fallback silences itself and keeps default coords
          setUsingGeo(false)
        }
      )
    }
  }, [])

  // Calculate moon values based on time and coordinates
  useEffect(() => {
    const calculateData = () => {
      const now = new Date()
      
      // Calculate moon illumination
      const illum = SunCalc.getMoonIllumination(now)
      const fraction = Math.round(illum.fraction * 100)
      const phase = illum.phase

      // Phase identification
      let phaseName = 'Unknown'
      if (phase < 0.03 || phase >= 0.97) phaseName = 'New Moon'
      else if (phase >= 0.03 && phase < 0.22) phaseName = 'Waxing Crescent'
      else if (phase >= 0.22 && phase < 0.28) phaseName = 'First Quarter'
      else if (phase >= 0.28 && phase < 0.47) phaseName = 'Waxing Gibbous'
      else if (phase >= 0.47 && phase < 0.53) phaseName = 'Full Moon'
      else if (phase >= 0.53 && phase < 0.72) phaseName = 'Waning Gibbous'
      else if (phase >= 0.72 && phase < 0.78) phaseName = 'Last Quarter'
      else if (phase >= 0.78 && phase < 0.97) phaseName = 'Waning Crescent'

      // Calculate moon position
      const pos = SunCalc.getMoonPosition(now, coords.lat, coords.lon)
      const altitudeDeg = pos.altitude * (180 / Math.PI)
      // Convert azimuth to compass direction (North = 0, East = 90, South = 180, West = 270)
      const azimuthDeg = (pos.azimuth * (180 / Math.PI) + 180) % 360

      setMoonData({
        phaseName,
        illumination: fraction,
        distance: pos.distance,
        altitude: altitudeDeg,
        azimuth: azimuthDeg,
      })
    }

    calculateData()
    const interval = setInterval(calculateData, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [coords])

  const formatDistance = (km: number) => {
    if (isMiles) {
      const miles = Math.round(km * 0.621371)
      return `${miles.toLocaleString()} MI`
    }
    return `${Math.round(km).toLocaleString()} KM`
  }

  // Calculate SVG circular stroke offset
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (moonData.illumination / 100) * circumference

  return (
    <section id="info" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 overflow-hidden bg-space-dark/40">
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20" />
      
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Title */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-xs tracking-widest text-cyan-glow font-orbitron uppercase font-bold text-glow-cyan">
            [ SECTION_02 // TELEMETRY_GRID ]
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold font-orbitron text-white">
            REAL-TIME LUNAR STATS
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto uppercase tracking-wide">
            Astrodynamic sensor feedback computed from coordinates and system time.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Moon Phase */}
          <div className="hud-panel p-6 border-glow-cyan flex flex-col items-center justify-between text-center gap-6 min-h-[250px]">
            <div className="flex items-center justify-between w-full border-b border-hud-border pb-3">
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">PHASE_INDEX</span>
              <Orbit className="w-4 h-4 text-cyan-glow" />
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-semibold font-orbitron text-cyan-glow uppercase tracking-wider">
                {moonData.phaseName}
              </span>
              <div className="text-[10px] text-gray-500 font-mono uppercase">
                Phase Index: {(moonData.illumination / 100).toFixed(2)} / 1.0
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono w-full border-t border-hud-border/40 pt-3">
              SYS STATUS: ACTIVE
            </div>
          </div>

          {/* Card 2: Illumination */}
          <div className="hud-panel p-6 border-glow-cyan flex flex-col items-center justify-between text-center gap-6 min-h-[250px]">
            <div className="flex items-center justify-between w-full border-b border-hud-border pb-3">
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">ILLUMINATION</span>
              <Eye className="w-4 h-4 text-cyan-glow" />
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-hud-gray fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-cyan-glow fill-none transition-all duration-500 shadow-[0_0_10px_#00f0ff]"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-orbitron text-white">
                <span className="text-lg font-black">{moonData.illumination}%</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono w-full border-t border-hud-border/40 pt-3">
              ALBEDO VALUE: {((moonData.illumination * 0.12) / 100).toFixed(3)}
            </div>
          </div>

          {/* Card 3: Distance */}
          <div className="hud-panel p-6 border-glow-cyan flex flex-col items-center justify-between text-center gap-6 min-h-[250px]">
            <div className="flex items-center justify-between w-full border-b border-hud-border pb-3">
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">DISTANCE_RANGE</span>
              <button
                onClick={() => setIsMiles(!isMiles)}
                className="text-[10px] text-cyan-glow border border-hud-border px-2 py-0.5 rounded hover:bg-cyan-glow/10 cursor-pointer transition-colors uppercase tracking-widest font-orbitron"
              >
                UNITS: {isMiles ? 'MI' : 'KM'}
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-black font-orbitron text-white text-glow-cyan">
                {formatDistance(moonData.distance)}
              </div>
              <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                Earth center to Moon center
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono w-full border-t border-hud-border/40 pt-3">
              LIGHT_TIME: {(moonData.distance / 299792.458).toFixed(4)}s
            </div>
          </div>

          {/* Card 4: Angular Position */}
          <div className="hud-panel p-6 border-glow-cyan flex flex-col items-center justify-between text-center gap-6 min-h-[250px]">
            <div className="flex items-center justify-between w-full border-b border-hud-border pb-3">
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">POSITION_HUD</span>
              <Compass className="w-4 h-4 text-cyan-glow" />
            </div>

            <div className="grid grid-cols-2 w-full gap-4 font-mono text-left text-xs text-gray-300">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest block">ALTITUDE</span>
                <span className="font-semibold text-white">{moonData.altitude.toFixed(2)}°</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest block">AZIMUTH</span>
                <span className="font-semibold text-white">{moonData.azimuth.toFixed(2)}°</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between border-t border-hud-border/40 pt-3 text-[10px] text-gray-500 font-mono">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-glow" />
                <span className="uppercase text-[9px]">
                  {usingGeo ? 'GEO_NODE' : 'NASA_KSC'}
                </span>
              </div>
              <span>
                {coords.lat.toFixed(2)}°N, {Math.abs(coords.lon).toFixed(2)}°{coords.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
