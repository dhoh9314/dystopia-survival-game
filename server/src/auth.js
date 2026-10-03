import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const COOKIE_NAME = 'session'

export function issueSession(res, account) {
  const token = jwt.sign({ accountId: account.id }, JWT_SECRET, { expiresIn: '30d' })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME)
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'not authenticated' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.accountId = payload.accountId
    next()
  } catch {
    return res.status(401).json({ error: 'invalid session' })
  }
}

export function verifySocketToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload.accountId
  } catch {
    return null
  }
}

export { COOKIE_NAME }
