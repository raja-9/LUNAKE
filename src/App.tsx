import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Components
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import Starfield from './components/Starfield'
import MoonHero from './components/MoonHero'
import MoonInfo from './components/MoonInfo'
import MiniGame from './components/MiniGame'
import ContactForm from './components/ContactForm'

// Initialize TanStack Query Client
const queryClient = new QueryClient()

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [launched, setLaunched] = useState(false)

  // GSAP Scroll Animations once launched
  useEffect(() => {
    if (!launched) return

    const sections = ['#hero', '#info', '#game', '#contact']
    
    const ctx = gsap.context(() => {
      sections.forEach((selector) => {
        gsap.fromTo(
          `${selector} > div`,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: selector,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [launched])

  return (
    <QueryClientProvider client={queryClient}>
      {/* 1. Starfield Twinkling Background */}
      <Starfield />

      {/* 2. CRT scanline visual effect */}
      <div className="scanline-overlay" />

      {/* 3. Futuristic Boot terminal Intro loading */}
      {!launched ? (
        <Intro onLaunch={() => setLaunched(true)} />
      ) : (
        <div className="w-full flex flex-col min-h-screen text-slate-200 selection:bg-cyan-glow/20 selection:text-cyan-glow">
          {/* 4. Fixed HUD navigation overlay */}
          <Navbar />

          {/* 5. Main Single-Page Sections Container */}
          <main className="w-full flex flex-col relative">
            {/* R3F Interactive Moon Hero */}
            <MoonHero />

            {/* Suncalc Moon Telemetry Info */}
            <MoonInfo />

            {/* Canvas Lunar Lander Mini Game */}
            <MiniGame />

            {/* Zod Validated HUD Contactuplink */}
            <ContactForm />
          </main>

          {/* 6. Footer Telemetry Info */}
          <footer className="w-full py-8 border-t border-hud-border/40 text-center font-mono text-[9px] text-gray-500 uppercase tracking-widest bg-space-black/90 relative z-10">
            <div>
              SYSTEMS ALIGNMENT // DESIGNED BY ANTIGRAVITY &copy; {new Date().getFullYear()}
            </div>
            <div className="text-cyan-glow/40 mt-1">
              NODE_CONNECTION: ESTABLISHED_AND_ENCRYPTED
            </div>
          </footer>
        </div>
      )}
    </QueryClientProvider>
  )
}
