import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',

  // Настройки сервера для разработки
  server: {
    host: '0.0.0.0', // Важно для Docker!
    port: 5173,       // Порт разработки
    strictPort: true, // Не пытаться использовать другой порт если занят
    allowedHosts: [
      'md.trexon.ru', // Ваш продакшен-домен
      'localhost'     // Для локальной разработки
    ],
    watch: {
      usePolling: true // Необходимо для работы в Docker на некоторых системах
    }
  },

  // Настройки превью-сервера
  preview: {
    port: 5173,
    strictPort: true
  },

  // Настройки сборки
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    chunkSizeWarningLimit: 1500 // Увеличиваем лимит предупреждений о размере чанков
  },

  // Оптимизации для Docker
  optimizeDeps: {
    exclude: ['js-big-decimal'] // Исключаем проблемные зависимости при необходимости
  }
});
