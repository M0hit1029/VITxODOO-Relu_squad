import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { resetPasswordSchema } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { resetPassword } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!submitted) return undefined
    const timer = window.setTimeout(() => navigate('/signin'), 2000)
    return () => window.clearTimeout(timer)
  }, [navigate, submitted])

  const onSubmit = form.handleSubmit(async (values) => {
    await resetPassword({
      ...values,
      token: params.get('token'),
    })
    setSubmitted(true)
  })

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.div animate={submitted ? { opacity: 0.85, scale: 0.98 } : { opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card>
          <CardContent className="p-8">
            {!submitted ? (
              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-primary">Reset Password</p>
                  <h1 className="mt-3 text-4xl text-card-foreground">Choose a fresh password</h1>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground">New password</label>
                  <Input type="password" {...form.register('password')} />
                  <p className="text-xs text-destructive">{form.formState.errors.password?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground">Confirm password</label>
                  <Input type="password" {...form.register('confirmPassword')} />
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword?.message}</p>
                </div>
                <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <h1 className="text-3xl text-card-foreground">Password updated</h1>
                <p className="mt-3 text-sm text-muted-foreground">Redirecting you back to sign in…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
