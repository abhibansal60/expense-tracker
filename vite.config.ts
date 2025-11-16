import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appVersion = process.env.npm_package_version ?? '0.0.0-dev'
const buildTimestamp = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
