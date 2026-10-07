import http from 'node:http'
import { readFileSync } from 'node:fs'
import { createRouter } from './router.js'

const PORT = process.env.PORT || 3000
const dbPath = new URL('../db.json', import.meta.url)
const db = JSON.parse(readFileSync(dbPath, 'utf8'))
const route = createRouter(db)

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const { status, body } = route(req, url)

  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
})

server.listen(PORT, () => {
  console.log(`mini-json-server running on http://localhost:${PORT}`)
})
