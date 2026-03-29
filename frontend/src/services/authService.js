import { api, withApiFallback } from '@/services/api'
import { createDemoToken, nextId, readDb, updateDb } from '@/services/mockDb'
import { sleep } from '@/lib/utils'
import { BASE_COUNTRIES } from '@/lib/constants'

function sanitizeUser(user) {
  const { password, ...safeUser } = user
  return safeUser
}

async function mockLogin({ email, password }) {
  await sleep(700)
  const { users, company } = readDb()
  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }

  return {
    token: createDemoToken(user),
    user: sanitizeUser(user),
    company,
  }
}

async function mockSignup(payload) {
  await sleep(900)
  const countryMatch = BASE_COUNTRIES.find((country) => country.name === payload.country)

  const session = updateDb((db) => {
    db.company = {
      ...db.company,
      id: nextId('company'),
      name: `${payload.fullName.split(' ')[0]}'s Company`,
      country: payload.country,
      baseCurrency: countryMatch?.currencyCode ?? 'INR',
    }

    const existing = db.users.find(
      (user) => user.email.toLowerCase() === payload.email.toLowerCase(),
    )

    if (existing) {
      throw new Error('A user with this email already exists.')
    }

    db.users = [
      {
        id: nextId('user'),
        name: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: 'admin',
        managerId: null,
        status: 'active',
      },
      ...db.users,
    ]
  })

  const user = session.users[0]

  return {
    token: createDemoToken(user),
    user: sanitizeUser(user),
    company: session.company,
  }
}

export async function login(credentials) {
  return withApiFallback(
    async () => {
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    },
    () => mockLogin(credentials),
  )
}

export async function signup(payload) {
  return withApiFallback(
    async () => {
      const response = await api.post('/api/auth/signup', payload)
      return response.data
    },
    () => mockSignup(payload),
  )
}

export async function forgotPassword(payload) {
  return withApiFallback(
    async () => {
      const response = await api.post('/api/auth/forgot-password', payload)
      return response.data
    },
    async () => {
      await sleep(900)
      return { success: true }
    },
  )
}

export async function resetPassword(payload) {
  return withApiFallback(
    async () => {
      const response = await api.post('/api/auth/reset-password', payload)
      return response.data
    },
    async () => {
      await sleep(1000)
      return { success: true }
    },
  )
}
