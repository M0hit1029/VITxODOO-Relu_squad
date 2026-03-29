import * as Tabs from '@radix-ui/react-tabs'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Receipt,
  Sparkles,
  Mail,
  Workflow,
  Zap,
  Shield,
  Globe,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import { SmokyCtaEffect } from '@/components/landing/SmokyCtaEffect'
import {
  LANDING_FEATURE_CARDS,
  LANDING_FEATURE_STRIP,
  ROLE_SHOWCASE,
  TESTIMONIALS,
} from '@/lib/constants'

const wordVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.3 + index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

const iconMap = [Workflow, Receipt, Landmark]

function AnimatedSection({ children, className = '', id }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function Landing() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  useEffect(() => {
    if (!emblaApi) return undefined
    const interval = window.setInterval(() => emblaApi.scrollNext(), 4500)
    return () => window.clearTimeout(interval)
  }, [emblaApi])

  return (
    <div className="overflow-x-hidden bg-background text-foreground">
      <LandingNavbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background layers */}
        <div className="hero-gradient absolute inset-0" />
        <div className="grid-dots absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 bottom-32 h-64 w-64 rounded-full bg-warning/8 blur-[80px]" />

        <div className="section-shell relative grid min-h-screen items-center gap-12 pb-20 pt-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm text-primary backdrop-blur-xl"
            >
              <Sparkles className="h-4 w-4" />
              Reimbursement management, redesigned for momentum
            </motion.div>

            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                {'Expense reimbursements, finally painless.'.split(' ').map((word, index) => (
                  <motion.span
                    key={`${word}-${index}`}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={wordVariants}
                    className="mr-3 inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="max-w-2xl text-lg leading-relaxed text-muted-foreground"
              >
                A premium finance workspace for employees, managers, and admins who want clarity, speed, and an approval trail that never feels like overhead.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Button asChild className="h-12 gap-2 px-6 text-base">
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-12 px-6 text-base">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </motion.div>

            {/* Trust stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-wrap gap-6 pt-4"
            >
              {[
                ['99.9%', 'Uptime', Zap],
                ['4.6h', 'Avg Approval', Shield],
                ['₹50L+', 'Processed', Globe],
              ].map((item) => {
                const StatIcon = item[2]
                return (
                  <div key={item[1]} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <StatIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="money-text text-lg font-semibold text-foreground">{item[0]}</p>
                      <p className="text-xs text-muted-foreground">{item[1]}</p>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, rotateX: 12, rotateY: -10, y: 40 }}
            animate={{ opacity: 1, rotateX: 0, rotateY: -4, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="floating-slow relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-primary/12 blur-3xl" />
            <div className="glass-card-strong relative rotate-[-3deg] overflow-hidden p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-display text-2xl text-card-foreground">Amber Ledger</p>
                  <p className="text-sm text-muted-foreground">Finance command deck</p>
                </div>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-destructive/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ['Pending reviews', '18'],
                    ['Reimbursed this month', '₹2.4L'],
                    ['Avg approval time', '4.6h'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-border/50 bg-background/60 p-4 backdrop-blur-xl">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="money-text mt-2 text-2xl font-semibold text-card-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border border-border/50 bg-background/60 p-4 backdrop-blur-xl">
                  <p className="font-medium text-card-foreground">Approval Pipeline</p>
                  <div className="mt-4 grid gap-3">
                    {['Submitted by Rohan', 'Manager review', 'Finance sign-off', 'Ready to reimburse'].map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-2xl border border-border/50 px-4 py-3 transition-all hover:bg-primary/5">
                        <div className={`h-3 w-3 rounded-full transition-colors ${index < 3 ? 'bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_40%,transparent)]' : 'bg-border'}`} />
                        <p className="text-sm text-card-foreground">{step}</p>
                        {index < 3 && <CheckCircle2 className="ml-auto h-4 w-4 text-primary/50" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURE STRIP ─── */}
      <section className="border-y border-border/40 bg-card/40 py-5 backdrop-blur-xl">
        <div className="ticker-mask overflow-hidden whitespace-nowrap">
          <div className="inline-flex animate-[marquee_18s_linear_infinite] gap-10 pr-10 text-sm font-medium text-muted-foreground">
            {[...LANDING_FEATURE_STRIP, ...LANDING_FEATURE_STRIP].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <AnimatedSection id="features" className="section-shell py-24">
        <motion.div variants={fadeUp} className="mb-14 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.28em] text-primary">Features</p>
          <h2 className="mt-4 text-4xl text-foreground lg:text-5xl">
            Everything you need to move fast.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for teams that want expense management to feel effortless, not bureaucratic.
          </p>
        </motion.div>
        <div className="grid gap-6 lg:grid-cols-3">
          {LANDING_FEATURE_CARDS.map((feature, index) => {
            const Icon = iconMap[index]
            return (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="feature-card-glow group h-full border-primary/8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_color-mix(in_oklab,var(--primary)_12%,transparent)]">
                  <CardContent className="relative p-7">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                    <div className="relative">
                      <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3.5 text-primary transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-2xl text-card-foreground">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                      <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                        Learn more <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </AnimatedSection>

      {/* ─── HOW IT WORKS ─── */}
      <AnimatedSection id="how-it-works" className="section-shell py-12">
        <motion.div variants={fadeUp} className="glass-card-strong p-8 lg:p-12">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-primary">How It Works</p>
            <h2 className="mt-4 text-4xl text-card-foreground lg:text-5xl">Submit. Approve. Get paid.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Three simple steps to go from expense to reimbursement.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ['1', 'Submit', 'Capture the expense, attach the receipt, and preview the converted amount.', BarChart3],
              ['2', 'Approve', 'Managers and finance teams review the request with the context they need.', Shield],
              ['3', 'Get Paid', 'Employees track the full timeline and know exactly where reimbursement stands.', Zap],
            ].map((item) => {
              const StepIcon = item[3]
              return (
                <motion.div key={item[0]} variants={fadeUp} className="glass-card group p-6 transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-lg font-semibold text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    {item[0]}
                  </div>
                  <div className="mb-4 text-primary">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl text-card-foreground">{item[1]}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item[2]}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ─── ROLE SHOWCASE ─── */}
      <AnimatedSection id="roles" className="section-shell py-24">
        <Tabs.Root defaultValue="employee">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary">Role Showcase</p>
              <h2 className="mt-4 text-4xl lg:text-5xl">One product, tuned for every seat.</h2>
            </div>
            <Tabs.List className="glass-card flex p-1.5">
              {ROLE_SHOWCASE.map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_16px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </motion.div>
          {ROLE_SHOWCASE.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <motion.div variants={fadeUp} className="space-y-6">
                <h3 className="font-display text-3xl text-foreground">{tab.title}</h3>
                <div className="space-y-4">
                  {tab.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-muted-foreground">{bullet}</p>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="mt-4 gap-1.5">
                  <Link to="/signup">
                    Try as {tab.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} className="glass-card-strong p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {['Overview', 'Queue', 'Insights', 'Controls'].map((panel) => (
                    <div key={panel} className="rounded-2xl border border-border/50 bg-background/60 p-4 backdrop-blur-xl transition-all hover:bg-background/80">
                      <p className="text-sm font-medium text-muted-foreground">{panel}</p>
                      <div className="mt-3 space-y-2">
                        <div className="h-3 rounded-full bg-primary/20" />
                        <div className="h-3 w-4/5 rounded-full bg-accent" />
                        <div className="h-3 w-2/3 rounded-full bg-accent" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </AnimatedSection>

      {/* ─── TESTIMONIALS ─── */}
      <AnimatedSection id="testimonials" className="section-shell py-24">
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-primary">Testimonials</p>
          <h2 className="mt-4 text-4xl lg:text-5xl">Loved by finance teams everywhere.</h2>
        </motion.div>
        <motion.div variants={fadeUp} className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {TESTIMONIALS.map((item) => (
              <div key={item.name} className="min-w-0 flex-[0_0_100%] px-2 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
                <Card className="glass-card h-full border-primary/8 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="flex h-full flex-col justify-between gap-8 p-7">
                    <div>
                      <div className="mb-4 flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-primary">★</span>
                        ))}
                      </div>
                      <p className="text-lg leading-8 text-card-foreground">"{item.quote}"</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ─── CTA ─── */}
      <AnimatedSection className="section-shell pb-24">
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_90%,white),color-mix(in_oklab,var(--primary)_65%,black))] px-8 py-16 text-primary-foreground lg:px-14"
        >
          <div className="grid-dots absolute inset-0 opacity-15" />
          <SmokyCtaEffect />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary-foreground/70">Ready When You Are</p>
              <h2 className="mt-4 text-4xl text-primary-foreground lg:text-5xl">Start managing expenses smarter today.</h2>
              <p className="mt-3 text-primary-foreground/70">Join thousands of teams already saving time and money.</p>
            </div>
            <Button asChild variant="secondary" className="h-13 shrink-0 gap-2 px-7 text-base">
              <Link to="/signup">
                Create your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="section-shell py-14">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
                  AL
                </div>
                <span className="font-display text-lg text-foreground">
                  Amber<span className="text-primary">Ledger</span>
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Painless reimbursement management for modern teams. Built with care for clarity, speed, and transparency.
              </p>
            </div>
            {[
              ['Product', ['Features', 'Pricing', 'Integrations', 'Changelog']],
              ['Company', ['About', 'Blog', 'Careers', 'Contact']],
              ['Legal', ['Privacy', 'Terms', 'Security', 'GDPR']],
            ].map(([heading, links]) => (
              <div key={heading}>
                <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{heading}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AmberLedger. All rights reserved.
            </p>
            <div className="flex gap-3">
              {[Mail, ExternalLink].map((SocialIcon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary"
                >
                  <SocialIcon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
