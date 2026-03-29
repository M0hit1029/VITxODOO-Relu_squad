const DEFAULT_ROUTE_BY_ROLE = {
  admin: '/admin',
  manager: '/approvals',
  employee: '/dashboard',
}

const ALLOWED_PREFIXES_BY_ROLE = {
  admin: ['/admin', '/approvals', '/dashboard', '/expenses', '/manager/dashboard'],
  manager: ['/approvals', '/manager/dashboard', '/dashboard', '/expenses'],
  employee: ['/dashboard', '/expenses'],
}

export function getDefaultRouteForRole(role) {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? '/dashboard'
}

export function isRouteAllowedForRole(role, path) {
  if (!path || !path.startsWith('/')) return false
  const allowedPrefixes = ALLOWED_PREFIXES_BY_ROLE[role] ?? []
  return allowedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function getSafeRedirectForRole(role, redirect) {
  if (isRouteAllowedForRole(role, redirect)) {
    return redirect
  }

  return getDefaultRouteForRole(role)
}
