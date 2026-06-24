import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  alpha: number
  twinkleSpeed: number
}

interface ShootingStar {
  x: number
  y: number
  dx: number
  dy: number
  length: number
  speed: number
  opacity: number
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let stars: Star[] = []
    let shootingStars: ShootingStar[] = []

    // Adjust canvas dimensions on resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    // Initialize stars
    const initStars = () => {
      stars = []
      const starCount = Math.floor((canvas.width * canvas.height) / 4000)
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          twinkleSpeed: Math.random() * 0.02 + 0.005,
        })
      }
    }

    const addShootingStar = () => {
      if (shootingStars.length >= 2) return
      
      const startX = Math.random() * canvas.width
      const startY = Math.random() * (canvas.height / 2)
      const angle = Math.PI / 6 + Math.random() * (Math.PI / 6) // diagonal falling angle
      const speed = Math.random() * 10 + 8

      shootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 80 + 40,
        speed: speed,
        opacity: 1,
      })
    }

    // Animation Loop
    const render = () => {
      ctx.fillStyle = '#020204'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and twinkle stars
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.twinkleSpeed = -star.twinkleSpeed
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.alpha))})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw and move shooting stars
      shootingStars.forEach((sStar, index) => {
        sStar.x += sStar.dx
        sStar.y += sStar.dy
        sStar.opacity -= 0.015

        if (sStar.opacity <= 0 || sStar.x > canvas.width || sStar.y > canvas.height) {
          shootingStars.splice(index, 1)
          return
        }

        ctx.strokeStyle = `rgba(0, 240, 255, ${sStar.opacity})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(sStar.x, sStar.y)
        ctx.lineTo(sStar.x - sStar.dx * 3, sStar.y - sStar.dy * 3)
        ctx.stroke()
      })

      // Randomly spawn shooting stars
      if (Math.random() < 0.0008) {
        addShootingStar()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="stars-bg" />
}
