import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Not `import.meta.dirname` — that needs Node 20.11+/21.2+, and build hosts
// with an older Node would fail here with "path argument must be of type
// string. Received undefined". This works on any Node version with ESM.
const root = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  // `vite dev` always serves index.html as the entry (unaffected by the options
  // below). `vite build` targets main.tsx directly and writes straight into the
  // Laravel app's public/build, so backend/resources/views/app.blade.php can
  // read build/.vite/manifest.json and render the combined single-deploy app.
  base: command === 'build' ? '/build/' : '/',
  build: {
    outDir: path.resolve(root, '../backend/public/build'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(root, 'src/main.tsx'),
    },
  },
}))
