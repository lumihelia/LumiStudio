import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { extractDraftForInput, sanitizeMyContext } from './api/extract.ts'
import type { CaptureInput } from './src/utils/extraction.ts'

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
            const input = body as Partial<CaptureInput>
            if (!isCaptureInput(input)) {
              res.statusCode = 400
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid capture payload' }))
              return
            }

            const result = await extractDraftForInput({
              ...input,
              myContext: sanitizeMyContext(input.myContext),
            })
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

function isCaptureInput(input: Partial<CaptureInput>): input is CaptureInput {
  return (
    typeof input.rawInput === 'string' &&
    typeof input.captureNote === 'string' &&
    typeof input.sourceType === 'string' &&
    ['article', 'video', 'podcast', 'webpage', 'clue'].includes(input.sourceType)
  )
}
