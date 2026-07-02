import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { extractDraftForInput, parseInputBody } from './api/extract.ts'
import { computeRelations } from './api/relations.ts'
import type { CaptureMyContext } from './src/utils/extraction.ts'
import { sanitizeRelationEntries } from './src/utils/relations.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-extract',
      configureServer(server) {
        server.middlewares.use('/api/extract', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Use POST' }))
            return
          }

          try {
            const body = await readJsonBody(req)
            const parseResult = await parseInputBody(body)

            if (!parseResult.ok) {
              res.statusCode = parseResult.statusCode
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: parseResult.error }))
              return
            }

            const result = await extractDraftForInput(parseResult.input)
            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            console.error('local extract failed', error)
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Local extract failed' }))
          }
        })
      },
    },
    {
      name: 'local-api-relations',
      configureServer(server) {
        server.middlewares.use('/api/relations', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Use POST' }))
            return
          }

          try {
            const body = (await readJsonBody(req)) as Record<string, unknown>
            const topic = String(body.topic ?? '').trim()
            const entries = sanitizeRelationEntries(body.entries)
            if (!topic || entries.length === 0) {
              res.statusCode = 400
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid relations payload' }))
              return
            }

            const myContext = body.myContext as CaptureMyContext | undefined
            const result = await computeRelations(topic, entries, myContext)
            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            console.error('local relations failed', error)
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Local relations failed' }))
          }
        })
      },
    },
  ],
})

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}
