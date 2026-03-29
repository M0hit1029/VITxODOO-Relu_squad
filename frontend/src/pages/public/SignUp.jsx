import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Search, Sparkles, Shield, Lock, Globe, FileCheck2, Workflow, ReceiptText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getCountries } from '@/services/currencyService'
import { signUpSchema } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'

function passwordStrength(value) {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  return score
}

const strengthLabels = ['Weak', 'Fair', 'Strong']
const strengthColors = ['bg-destructive', 'bg-warning', 'bg-success']

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function SignUp() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [countries, setCountries] = useState([])
  const [countrySearch, setCountrySearch] = useState('')

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: 'India',
    },
  })

  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]))
  }, [])

  const filteredCountries = useMemo(
    () =>
      countries
        .filter((country) => country.name.toLowerCase().includes(countrySearch.toLowerCase()))
        .slice(0, 40),
    [countries, countrySearch],
  )

  const selectedCountry = countries.find((country) => country.name === form.watch('country'))
  const strength = passwordStrength(form.watch('password') ?? '')

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signup(values)
      toast.success('Company setup complete.')
      navigate('/admin')
    } catch (error) {
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
        <div className="pointer-events-none absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[80px]" />
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
                <p className="text-sm text-muted-foreground">Set up in under a minute</p>
              </div>
            </div>
          </div>

          {/* What you get */}
          <div className="space-y-5">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            >
              What you'll get
            </motion.p>

            {[
              { icon: Workflow, title: 'Multi-level approvals', desc: 'Manager → Finance → Payout, fully configurable' },
              { icon: ReceiptText, title: 'OCR receipt scanning', desc: 'Snap a photo, auto-fill the form' },
              { icon: Globe, title: 'Multi-currency support', desc: 'Spend in any currency, reimburse in yours' },
              { icon: FileCheck2, title: 'Complete audit trail', desc: 'Every action logged, exportable anytime' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur-xl transition-all hover:border-primary/20 hover:bg-white/8"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{item.desc}</p>
                </div>
              </motion.div>
              )
            })}
          </div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-5 text-xs text-muted-foreground/60"
          >
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SOC 2</span>
            <span className="h-3 w-px bg-border/30" />
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> 256-bit</span>
            <span className="h-3 w-px bg-border/30" />
            <span>GDPR ready</span>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="relative flex flex-col">
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
          <div className="w-full max-w-[440px]">
            {/* Header */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Company Setup
              </div>
              <h1 className="text-3xl text-foreground lg:text-[2.1rem]">
                Create your<br />reimbursement workspace
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll be the admin. Add team members later.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form custom={1} initial="hidden" animate="visible" variants={fadeUp} className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full name</label>
                  <Input
                    {...form.register('fullName')}
                    placeholder="Ariana Mehra"
                    className="h-11 rounded-xl border-border/40 bg-card/50 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Work email</label>
                  <Input
                    {...form.register('email')}
                    placeholder="you@company.com"
                    className="h-11 rounded-xl border-border/40 bg-card/50 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input
                    type="password"
                    {...form.register('password')}
                    placeholder="Create a password"
                    className="h-11 rounded-xl border-border/40 bg-card/50 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirm</label>
                  <Input
                    type="password"
                    {...form.register('confirmPassword')}
                    placeholder="Repeat password"
                    className="h-11 rounded-xl border-border/40 bg-card/50 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Password strength */}
              <div className="flex items-center gap-3">
                <div className="flex flex-1 gap-1.5">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        index < strength ? strengthColors[strength - 1] : 'bg-muted/40'
                      }`}
                    />
                  ))}
                </div>
                {strength > 0 && (
                  <span className={`text-[11px] font-semibold ${
                    strength === 1 ? 'text-destructive' : strength === 2 ? 'text-warning' : 'text-success'
                  }`}>
                    {strengthLabels[strength - 1]}
                  </span>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="h-11 rounded-xl border-border/40 bg-card/50 pl-9 backdrop-blur-xl transition-all focus:border-primary/50 focus:bg-card/80 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                    placeholder="Search countries"
                  />
                </div>
                <Select
                  value={form.watch('country')}
                  onValueChange={(value) => form.setValue('country', value)}
                  options={filteredCountries.map((country) => ({
                    value: country.name,
                    label: country.name,
                    flag: country.flag,
                    meta: country.currencyCode,
                  }))}
                  placeholder="Select a country"
                />
                {selectedCountry && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-sm text-primary backdrop-blur-xl"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Base currency: {selectedCountry.flag} {selectedCountry.currencyCode}
                  </motion.div>
                )}
              </div>

              <Button
                className="h-11 w-full rounded-xl shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-all hover:shadow-[0_12px_32px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creating workspace…' : 'Create workspace'}
              </Button>
            </motion.form>

            {/* Trust badges + footer */}
            <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
              <div className="mt-6 flex items-center justify-center gap-6">
                {[
                  { icon: Shield, text: 'Encrypted' },
                  { icon: Lock, text: 'Secure' },
                  { icon: Globe, text: 'Global' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                  <div key={item.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                    <Icon className="h-3.5 w-3.5" />
                    {item.text}
                  </div>
                  )
                })}
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/signin" className="font-medium text-primary transition-colors hover:text-primary/80">
                  Sign in →
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
