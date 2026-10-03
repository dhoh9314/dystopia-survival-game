import 'dotenv/config'
import express from 'express'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { authRouter } from './routes/auth.js'
import { charactersRouter } from './routes/characters.js'
import { createGameServer } from './game/socket.js'
import { loadShelters } from './game/shelterStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 4000
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
// In dev the client is a separate Vite server (5173); in production it's
// served by this same process, so there's no cross-origin request to allow.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || (IS_PRODUCTION ? true : 'http://localhost:5173')

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/characters', charactersRouter)

if (IS_PRODUCTION) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  // SPA fallback for client-side routing. No path pattern (vs. app.get('*', ...))
  // because Express 5's path-to-regexp rejects a bare '*' — this plain
  // middleware form matches anything that reached here unhandled.
  app.use((req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

const httpServer = http.createServer(app)
createGameServer(httpServer, CLIENT_ORIGIN)

await loadShelters()

httpServer.listen(PORT, () => {
  console.log(`[dystopia-server] listening on :${PORT}`)
})
