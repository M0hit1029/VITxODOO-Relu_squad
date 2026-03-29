import { api } from '@/services/api'
import { normalizeCompany } from '@/services/normalizers'

export async function getCompanySettings() {
  const response = await api.get('/api/company')
  return normalizeCompany(response.data)
}

export async function updateCompanySettings(payload) {
  const response = await api.put('/api/company', payload)
  return normalizeCompany(response.data)
}
