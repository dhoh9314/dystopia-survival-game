// In dev, the client (5173) and server (4000) run as separate processes.
// In production the server serves the built client itself (same origin),
// so API_BASE is just '' and every request/socket connection stays relative.
export const API_BASE = import.meta.env.DEV ? 'http://localhost:4000' : ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || '요청에 실패했습니다.')
    err.data = data
    throw err
  }
  return data
}

export const api = {
  redeem: (inviteCode, displayName) =>
    request('/api/auth/redeem', { method: 'POST', body: JSON.stringify({ inviteCode, displayName }) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  superpowers: () => request('/api/characters/superpowers'),
  recipes: () => request('/api/characters/recipes'),
  items: () => request('/api/characters/items'),
  codexInfo: () => request('/api/characters/codex-info'),
  listCharacters: () => request('/api/characters'),
  createCharacter: (name, superpower) =>
    request('/api/characters', { method: 'POST', body: JSON.stringify({ name, superpower }) }),
  deleteCharacter: (id) => request(`/api/characters/${id}`, { method: 'DELETE' }),
  selectCharacter: (id) => request(`/api/characters/${id}/select`, { method: 'POST' }),
}
