FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD [ "yarn", "start" ]
