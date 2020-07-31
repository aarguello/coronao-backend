FROM node:lts-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .
CMD ["npm", "start"]
EXPOSE 3000
