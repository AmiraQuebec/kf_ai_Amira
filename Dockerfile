FROM node:6.17.1-alpine

COPY dist4 /app
WORKDIR /app
CMD ["node", "server/app.js"]
