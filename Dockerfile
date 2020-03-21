FROM node:13.10
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .
EXPOSE 3000
