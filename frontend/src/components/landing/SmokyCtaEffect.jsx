import { useEffect, useRef } from 'react'

export function SmokyCtaEffect() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let w = 0
    let h = 0

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function createParticle(spread) {
      return {
        x: spread ? Math.random() * w : w + Math.random() * 60,
        y: Math.random() * h,
        size: 30 + Math.random() * 80,
        speedX: -(1.5 + Math.random() * 2.5),
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: 0.04 + Math.random() * 0.1,
        life: spread ? Math.random() * 200 : 0,
        maxLife: 150 + Math.random() * 200,
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 35 }, () => createParticle(true))
    }

    function animate() {
      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speedX
        p.y += p.speedY + Math.sin(p.life * 0.02) * 0.15
        p.life++

        let alpha = p.opacity
        if (p.life < 20) alpha *= p.life / 20
        if (p.life > p.maxLife - 30) alpha *= (p.maxLife - p.life) / 30

        if (p.x < -p.size || p.life >= p.maxLife) {
          particles[i] = createParticle(false)
          continue
        }

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        g.addColorStop(0, `rgba(255,255,255,${alpha * 1.8})`)
        g.addColorStop(0.3, `rgba(255,235,190,${alpha})`)
        g.addColorStop(1, 'rgba(255,220,150,0)')

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ mixBlendMode: 'soft-light', zIndex: 1 }}
    />
  )
}
