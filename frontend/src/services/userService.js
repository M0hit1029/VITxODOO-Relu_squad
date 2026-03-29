import { api, withApiFallback } from '@/services/api'
import { nextId, readDb, updateDb } from '@/services/mockDb'
import { sleep } from '@/lib/utils'

async function mockListUsers(filters = {}) {
  await sleep(320)
  const db = readDb()
  return db.users.filter((user) => {
    if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false
    if (filters.search) {
      const haystack = `${user.name} ${user.email}`.toLowerCase()
      if (!haystack.includes(filters.search.toLowerCase())) return false
    }
    return true
  })
}

async function mockCreateUser(payload) {
  await sleep(700)
  const updated = updateDb((db) => {
    db.users.unshift({
      id: nextId('user'),
      name: payload.fullName,
      email: payload.email,
      password: 'TempPass123',
      role: payload.role,
      managerId: payload.managerId || null,
      status: 'invited',
    })
  })
  return updated.users[0]
}

async function mockUpdateUser(userId, updates) {
  await sleep(500)
  const updated = updateDb((db) => {
    const user = db.users.find((entry) => entry.id === userId)
    if (!user) return
    Object.assign(user, updates)
  })
  return updated.users.find((user) => user.id === userId)
}

async function mockSendPassword() {
  await sleep(450)
  return { success: true }
}

export async function listUsers(filters) {
  return withApiFallback(
    async () => {
      const response = await api.get('/api/users', { params: filters })
      return response.data
    },
    () => mockListUsers(filters),
  )
}

export async function createUser(payload) {
  return withApiFallback(
    async () => {
      const response = await api.post('/api/users', payload)
      return response.data
    },
    () => mockCreateUser(payload),
  )
}

export async function updateUser(userId, updates) {
  return withApiFallback(
    async () => {
      const response = await api.put(`/api/users/${userId}`, updates)
      return response.data
    },
    () => mockUpdateUser(userId, updates),
  )
}

export async function sendPassword(userId) {
  return withApiFallback(
    async () => {
      const response = await api.post(`/api/users/${userId}/send-password`)
      return response.data
    },
    () => mockSendPassword(userId),
  )
}
