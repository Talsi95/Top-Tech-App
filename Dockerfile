# Stage 1: Build the Frontend
FROM node:20 AS frontend-builder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. ./
RUN npm run build


# Stage 2: Create the Final Image
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# העתקת כל הקבצים של ה-Backend מהמחשב המקומי (מכיוון שאין צורך ב-Builder נפרד)
COPY ./backend/. ./
RUN npm install

# העתקת הקבצים הסטטיים של ה-Frontend משלב הבנייה הראשון
COPY --from=frontend-builder /app/dist ./dist

# הגדרת פורט 5000 שבו השרת שלך מאזין
EXPOSE 5000

# הפקודה שמפעילה את השרת שלך
CMD ["node", "app.js"]