import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { forgotPasswordSchema } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await forgotPassword(values)
    setSubmitted(true)
  })

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {!submitted ? (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary">Forgot Password</p>
                <h1 className="mt-3 text-4xl text-card-foreground">Reset your password</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Enter the email tied to your workspace and we’ll send a reset link.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Email</label>
                <Input {...form.register('email')} placeholder="you@company.com" />
                <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
              </div>
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success"
              >
                <CheckCircle2 className="h-8 w-8" />
              </motion.div>
              <h1 className="text-3xl text-card-foreground">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If this email exists in the system, a password reset link is on its way.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
