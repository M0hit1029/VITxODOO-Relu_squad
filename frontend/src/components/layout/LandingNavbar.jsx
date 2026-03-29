import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Roles', href: '#roles' },
  { label: 'Testimonials', href: '#testimonials' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 60)
  })

  const handleNavClick = (e, href) => {
    if (href.startsWith('#') && isLanding) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setMobileOpen(false)
      }
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled ? 'top-3 px-4' : 'top-0 px-0'
        }`}
      >
        <div
          className={`flex w-full items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled
              ? 'h-12 max-w-3xl rounded-2xl border border-border/60 bg-background/75 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl'
              : 'section-shell h-16 bg-transparent lg:h-18'
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-xl bg-primary font-display font-bold text-primary-foreground shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_35%,transparent)] transition-all duration-500 ${
                scrolled ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-sm'
              }`}
            >
              AL
            </div>
            <span
              className={`font-display tracking-tight text-foreground transition-all duration-500 ${
                scrolled ? 'text-sm' : 'text-lg'
              }`}
            >
              Amber<span className="text-primary">Ledger</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`group relative rounded-lg font-medium text-muted-foreground transition-colors hover:text-foreground ${
                  scrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                }`}
              >
                {link.label}
                <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="ghost"
              asChild
              className={`transition-all duration-500 ${
                scrolled ? 'h-7 px-3 text-xs' : 'h-9 px-4 text-sm'
              }`}
            >
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button
              asChild
              className={`gap-1.5 transition-all duration-500 ${
                scrolled ? 'h-7 px-3 text-xs' : 'h-9 gap-1.5 px-4 text-sm'
              }`}
            >
              <Link to="/signup">
                Get Started
                <ArrowRight className={`transition-all duration-500 ${scrolled ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
              </Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={`flex items-center justify-center rounded-xl text-foreground transition-all hover:bg-accent lg:hidden ${
              scrolled ? 'h-8 w-8' : 'h-10 w-10'
            }`}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-border/50 bg-background/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">
                    AL
                  </div>
                  <span className="font-display text-base text-foreground">AmberLedger</span>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              <div className="space-y-3 border-t border-border/50 px-5 py-5">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/signin" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full gap-1.5">
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
