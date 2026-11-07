let csrf: string | undefined
export class ApiError extends Error { constructor(message: string, public status: number) { super(message) } }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const write = init.method && !['GET', 'HEAD'].includes(init.method)
  if (write && !csrf) { const r = await fetch('/api/account/csrf', { credentials: 'same-origin' }); csrf = (await r.json()).token }
  const r = await fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(write ? { 'X-CSRF-TOKEN': csrf! } : {}), ...init.headers } })
  if (!r.ok) {
    const problem = await r.json().catch(() => ({}))
    if (r.status === 401 && !path.startsWith('/account/')) window.dispatchEvent(new Event('session-expired'))
    const errors = problem.errors ? Object.values(problem.errors).flat().join(' ') : undefined
    throw new ApiError(errors || problem.title || (r.status === 429 ? 'Too many attempts. Please wait a minute.' : 'Request failed. Please try again.'), r.status)
  }
  if (path === '/account/login' || path === '/account/logout') csrf = undefined
  return r.status === 204 ? undefined as T : await r.json()
}
export const json = (method: string, value: unknown): RequestInit => ({ method, body: JSON.stringify(value) })
