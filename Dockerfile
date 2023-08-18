FROM node:18

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "nodemon", "index.js"]
