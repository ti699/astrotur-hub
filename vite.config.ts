import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
    routeRules: {
      // Proxy para a API / Autenticação (resolve o POST 404 na porta 3002)
      '/api/**': {
        proxy: 'http://187.127.0.219:3002/api/**',
      },
      '/auth/**': {
        proxy: 'http://187.127.0.219:3002/auth/**',
      },
      // Proxy para o módulo Patrimônio
      '/patrimonio': {
        proxy: 'http://187.127.0.219:8081/patrimonio',
      },
      '/patrimonio/**': {
        proxy: 'http://187.127.0.219:8081/patrimonio/**',
      },
    },
  },
});