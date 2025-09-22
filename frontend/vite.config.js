import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {

  const isDev = mode === 'development'


  const API_URL = isDev
    ? 'http://localhost:5001/api'
    : '/api'

  return {
    plugins: [tailwindcss(), react()],
    define: {
      __API_URL__: JSON.stringify(API_URL),
    }
  }
})
