import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  remember: z.boolean().optional(),
})

export const signUpSchema = z
  .object({
    fullName: z.string().min(3, 'Enter your full name.'),
    email: z.email('Enter a valid work email.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[A-Z]/, 'Include an uppercase letter.')
      .regex(/[0-9]/, 'Include a number.'),
    confirmPassword: z.string(),
    country: z.string().min(1, 'Choose a country.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const expenseSchema = z.object({
  description: z.string().min(3, 'Add a clear description.').max(500, 'Keep it within 500 characters.'),
  expenseDate: z.string().min(1, 'Choose an expense date.'),
  category: z.string().min(1, 'Choose a category.'),
  paidBy: z.string().min(1, 'Select who paid.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  currency: z.string().min(3, 'Choose a currency.'),
  remarks: z.string().max(500, 'Keep remarks within 500 characters.').optional().or(z.literal('')),
})

export const createUserSchema = z.object({
  fullName: z.string().min(3, 'Enter the user name.'),
  email: z.email('Enter a valid email address.'),
  role: z.enum(['admin', 'manager', 'employee']),
  managerId: z.string().optional(),
})

export const approvalDecisionSchema = z.object({
  comment: z.string().max(300, 'Keep comments concise.').optional().or(z.literal('')),
})

export const approvalRuleSchema = z.object({
  name: z.string().min(3, 'Give the rule a name.'),
  description: z.string().min(6, 'Add a short description.'),
  employeeId: z.string().min(1, 'Select an employee.'),
  isManagerRequired: z.boolean(),
  mode: z.enum(['sequential', 'parallel', 'hybrid']),
  minApprovalPercentage: z.coerce.number().min(0).max(100),
  approvers: z
    .array(
      z.object({
        userId: z.string().min(1),
        isRequired: z.boolean(),
      }),
    )
    .min(1, 'Add at least one approver.'),
})
