import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  preflight: false,
  // attributify: true,
  extract: {
    include: ['**/*.{vue,html,js,ts,jsx,tsx,css}'],
    exclude: ['node_modules', '.git', '.next'],
  },
})
