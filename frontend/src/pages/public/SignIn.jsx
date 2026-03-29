import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Sparkles, ReceiptText, Shield, Zap, TrendingUp, Clock, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DEMO_CREDENTIALS } from '@/lib/constants'
import { signInSchema } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'
import { shouldUseMockApi } from '@/services/api'

function getRedirectPath(role) {
  if (role === 'admin') return '/admin'
  if (role === 'manager') return '/approvals'
  return '/dashboard'
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function SignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: shouldUseMockApi ? 'employee@amberledger.io' : '',
      password: shouldUseMockApi ? 'password123' : '',
      remember: true,
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await login(values)
      const redirect = params.get('redirect')
      navigate(redirect || getRedirectPath(session.user.role))
    } catch (error) {
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
      toast.error(error.message)
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ─── Left Decorative Panel ─── */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_18%,var(--card)),color-mix(in_oklab,var(--card)_92%,black))]" />
        <div className="grid-dots absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-warning/12 blur-[60px]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo + back */}
          <div>
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-white/8 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-primary font-display text-base font-bold text-primary-foreground shadow-[0_6px_24px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
                AL
              </div>
              <div>
                <p className="font-display text-2xl text-card-foreground">
                  Amber<span className="text-primary">Ledger</span>
                </p>
                <p className="text-sm text-muted-foreground">Painless reimbursements</p>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            >
              Why teams love us
            </motion.p>

            {[
              { icon: TrendingUp, stat: '₹2.4L', label: 'Reimbursed this month', desc: 'Automated payouts, zero delays' },
              { icon: Clock, stat: '4.6h', label: 'Avg approval time', desc: 'From submission to sign-off' },
              { icon: Users, stat: '48', label: 'Expenses today', desc: 'Across all departments' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-xl transition-all hover:border-primary/20 hover:bg-white/8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="money-text text-xl font-bold text-card-foreground">{item.stat}</span>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground/70">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-5 text-xs text-muted-foreground/60"
          >
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SOC 2</span>
            <span className="h-3 w-px bg-border/30" />
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> 99.9% uptime</span>
            <span className="h-3 w-px bg-border/30" />
            <span>256-bit encrypted</span>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="relative flex flex-col">
        {/* Subtle background */}
        <div className="auth-gradient absolute inset-0" />
        <div className="grid-dots absolute inset-0 opacity-15" />

        {/* Mobile header */}
        <div className="relative flex items-center justify-between p-4 lg:hidden">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">AL</div>
            <span className="font-display text-sm text-foreground">AmberLedger</span>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <motion.div
            animate={shake ? { x: [0, -10, 10, -8, 0] } : { x: 0 }}
            className="w-full max-w-[420px]"
          >
            {/* Header */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Welcome back
              </div>
              <h1 className="text-3xl text-foreground lg:text-[2.1rem]">
                Sign in to your<br />workspace
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {shouldUseMockApi ? 'Pick a demo account or use your credentials.' : 'Use your workspace credentials to continue.'}
              </p>
            </motion.div>

            {/* Form */}
            <motion.form custom={1} initial="hidden" animate="visible" variants={fadeUp} className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  {...form.register('email')}
                  placeholder="you@company.com"
                  className="h-11 rounded-xl border-border/40 bg-card/50 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="h-11 rounded-xl border-border/40 bg-card/50 pr-10 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="rounded border-border accent-primary" {...form.register('remember')} />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-medium text-primary transition-colors hover:text-primary/80">
                  Forgot?
                </Link>
              </div>

              <Button className="h-11 w-full rounded-xl shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-all hover:shadow-[0_12px_32px_color-mix(in_oklab,var(--primary)_35%,transparent)]" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </motion.form>

            <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
              {shouldUseMockApi && (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/30" />
                    <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Quick access</span>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                  <div className="grid gap-2">
                    {DEMO_CREDENTIALS.map((demo) => (
                      <button
                        key={demo.role}
                        type="button"
                        className="group flex w-full items-center justify-between rounded-xl border border-border/30 bg-card/40 px-4 py-3 text-left backdrop-blur-xl transition-all hover:-translate-y-px hover:border-primary/25 hover:bg-card/70 hover:shadow-[0_4px_16px_color-mix(in_oklab,var(--primary)_8%,transparent)]"
                        onClick={() => {
                          form.setValue('email', demo.email)
                          form.setValue('password', demo.password)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-display text-xs font-semibold text-primary transition-transform group-hover:scale-110">
                            {demo.role.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{demo.role}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{demo.email}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Need a workspace?{' '}
                <Link to="/signup" className="font-medium text-primary transition-colors hover:text-primary/80">
                  Create one →
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
