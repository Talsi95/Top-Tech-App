FROM node:20 AS frontend-builder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. ./
RUN npm run build


FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY ./backend/. ./
RUN npm install

COPY --from=frontend-builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "app.js"]