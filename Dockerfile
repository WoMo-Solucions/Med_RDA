FROM node:20-alpine

WORKDIR /app

COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev

COPY . .

EXPOSE 8086

CMD ["node", "backend/server.js"]
