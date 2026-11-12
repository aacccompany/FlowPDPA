import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'https://flowpdpa-api.aacc-ai.com'
  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: apiProxyTarget,
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ''),
      configure(proxy) {
        proxy.on('proxyReq', (proxyRequest, request) => {
          console.info(`[api-proxy] ${request.method} ${request.url} -> ${proxyRequest.protocol}//${proxyRequest.host}${proxyRequest.path}`)
        })
        proxy.on('proxyRes', (proxyResponse, request) => {
          console.info(`[api-proxy] ${request.method} ${request.url} <- ${proxyResponse.statusCode}`)
        })
        proxy.on('error', (error, request) => {
          console.error(`[api-proxy] ${request.method} ${request.url} failed: ${error.message}`)
        })
      },
    },
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'flowpdpa-preview-cache-headers',
        configurePreviewServer(server) {
          server.middlewares.use((request, response, next) => {
            if (request.url?.startsWith('/assets/')) {
              response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            }
            next()
          })
        },
      },
    ],
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
