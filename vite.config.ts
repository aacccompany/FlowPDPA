import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = env.VITE_API_PROXY_TARGET ? {
    '/api': {
      target: env.VITE_API_PROXY_TARGET,
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ''),
    },
  } : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy: apiProxy },
    preview: {
      allowedHosts: ['flowpdpa-test.aacc-ai.com'],
      proxy: apiProxy,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
