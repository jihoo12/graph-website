import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // <-- Native Oxc is now baked into this!

export default defineConfig({
  plugins: [react()]
})