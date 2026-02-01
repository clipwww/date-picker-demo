import { defineConfig, presetWind3 } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
  presets: [presetWind3({ preflight: 'on-demand' })],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  content: {
    pipeline: {
      include: ["**/*.{vue,html,js,ts,jsx,tsx,css}"],
      exclude: ["node_modules", ".git", ".next"],
    },
  },
})
