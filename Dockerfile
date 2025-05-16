FROM node:18-alpine AS builder

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Удаление ненужных файлов для экспорта PDF
RUN rm -f src/utils/pdfExport.ts

# Сборка приложения
RUN npm run build

# Создание легковесного образа для запуска
FROM nginx:alpine

# Копирование собранного приложения из предыдущего этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копирование nginx конфигурации
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Изменение прав доступа для файлов nginx
RUN chmod -R 755 /usr/share/nginx/html

# Открытие порта
EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
