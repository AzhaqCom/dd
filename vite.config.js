// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Utilise la variable d'environnement, ou une chaîne vide par défaut en local
const base_path = process.env.VITE_APP_BASE_PATH || '';

export default defineConfig({
  plugins: [react()],
  base: base_path,
})