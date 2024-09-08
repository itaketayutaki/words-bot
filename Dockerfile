FROM node:lts-slim

WORKDIR /usr/src/app

ENV PORT 3000

COPY package*.json ./

RUN npm install --only=production

COPY . ./

RUN npm run build
CMD [ "npm", "start" ]