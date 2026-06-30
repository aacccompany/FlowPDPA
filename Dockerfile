FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY .env .

RUN npm run build

EXPOSE 8808

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8808"]
