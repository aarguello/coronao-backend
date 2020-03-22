FROM node:13.10
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .
CMD ["npm", "start"]
EXPOSE 3000
