FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY bun.lock ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "start"]