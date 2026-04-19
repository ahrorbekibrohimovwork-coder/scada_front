import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-ejournal',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          if (url.startsWith('/ejournal') && !url.includes('.')) {
            const ejournalIndex = resolve(__dirname, 'public/ejournal/index.html')
            if (existsSync(ejournalIndex)) {
              res.setHeader('Content-Type', 'text/html')
              res.end(readFileSync(ejournalIndex, 'utf-8'))
              return
            }
          }
          next()
        })
      },
    },
  ],
})
