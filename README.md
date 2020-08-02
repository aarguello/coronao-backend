# CoronAO

This NodeJS project contains the server side code for CoronAO, a browser based 2D combat game inspired on the famous RPG Argentum Online (AO).

## Build with Docker

Simplest way to build and run the project locally is through a Docker container.

`make run`

`make debug`

## Build with npm

To run the project using npm, set the enviroment variables **DB_URI** and **JWT_TOKEN**. The former should point to a running MongoDB database. A random string should suffice for the latter.

`npm start`

`npm run debug`

## Debugging

Debugging is possible using Chrome's dev tools.

`chrome://inspect`