import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
    routeRules: {
      // Mapeia chamadas do frontend para a API com o prefixo /api correto
      '/api/**': {
        proxy: 'http://187.127.0.219:3002/api/**',
      },
      '/auth/**': {
        proxy: 'http://187.127.0.219:3002/api/auth/**',
      },
      // Proxy do Patrimônio
      '/patrimonio': {
        proxy: 'http://187.127.0.219:8081/patrimonio',
      },
      '/patrimonio/**': {
        proxy: 'http://187.127.0.219:8081/patrimonio/**',
      },
    },
  },
});