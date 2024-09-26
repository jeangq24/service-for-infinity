//Imports required
const express = require('express');
const routes = require('./routes/index.js');
const { morganLogging, bodyParserUrlencoded, bodyParseJson, configCors, errorHandler, notFoundHandler, swaggerConfig, parserCookie, limiter } = require('./middleware/configServer.js');
const { createServer } = require('node:http');
const {initializeSockets} = require("./lib/socket.js");
//Init
const server = express();
const socketServer = createServer(server);
initializeSockets(socketServer);

server.name = 'INFINITY API REST';

//Config
server.use(
  morganLogging,
  bodyParserUrlencoded,
  bodyParseJson,
  express.json(),
  configCors,
  parserCookie,
  limiter
);

server.use(
  '/',
  routes,
);


//Swagger route 
const [swaggerEndpoint, swaggerServe, swaggerSetup] = swaggerConfig();
server.use(
  swaggerEndpoint,
  swaggerServe,
  swaggerSetup
);

//Handlers
server.use(
  errorHandler,
  notFoundHandler,
);

//Modules exports
module.exports = {socketServer};
