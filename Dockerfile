FROM node:20 AS frontend-builder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. ./
RUN npm run build

# שלב 2: בניית ה-Backend והעתקת קבצים
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY ./backend/package*.json ./
RUN npm install
COPY ./backend/. ./

# שלב 3: בניית התמונה הסופית (כוללת את הכל)
FROM node:18-alpine
WORKDIR /app

# התקנת serve כשרת סטטי
RUN npm install -g serve

# העתקת ה-dist של ה-frontend מהשלב הראשון
COPY --from=frontend-builder /app/dist ./dist

# העתקת הכל הקבצים והספריות של ה-backend
COPY --from=backend-builder /app ./

# פקודת ההפעלה הסופית
# הוספת -s ל-serve כדי שהאפליקציה תשרת את הקבצים הסטטיים מתיקיית ה-dist
CMD ["serve", "-s", "dist"]

# חשוב: אם ה-backend שלך אחראי על הגשת הקבצים הסטטיים, פקודה זו צריכה להיות שונה.
# לדוגמה: CMD ["node", "server.js"] ואז בקוד ה-Node.js שלך תוסיף שורה שתשרת קבצים סטטיים מהתיקייה `dist`