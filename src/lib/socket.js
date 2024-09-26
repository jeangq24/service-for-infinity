const { Server } = require('socket.io');
const logger = require('./logs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Para manejar cookies
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';
const {client_host} = require("../lib/getHosts.js")
let io;

const initializeSockets = (socketServer) => {
  io = new Server(socketServer, {
    cors: {
      origin: client_host || '*', // Usa client_host si está disponible, o '*' en su defecto
      credentials: true, // Equivalente a Access-Control-Allow-Credentials
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Equivalente a Access-Control-Allow-Headers
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Equivalente a Access-Control-Allow-Methods
    },
  });
  
  // // Middleware para autenticar sockets
  // io.use((socket, next) => {
  //   try {
  //     // Parsear la cookie HTTP-only desde el handshake
  //     const cookies = socket.handshake.headers.cookie;
  //     if (!cookies) {
  //       throw new Error('No cookies found');
  //     }

  //     const parsedCookies = cookie.parse(cookies);
  //     const token = parsedCookies.token; // El nombre de la cookie donde guardas el token

  //     if (!token) {
  //       throw new Error('Authentication token not found');
  //     }

  //     // Verificar el token
  //     jwt.verify(token, SECRET_KEY, (err, user) => {
  //       if (err) {
  //         throw new Error('Invalid token');
  //       }
  //       socket.user = user; // Almacenar la información del usuario en el socket
  //       next(); // Pasar al siguiente middleware si todo es correcto
  //     });
  //   } catch (error) {
  //     logger.error(`[Socket::Auth] - Authentication error: ${error.message}`);
  //     next(new Error('Authentication error'));
  //   }
  // });

  io.on('connection', (socket) => {
    logger.info("[Socket::Connected] - New client connected");
    socket.on('disconnect', () => {
      logger.info('[Socket::Disconnected] - Client disconnected');
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSockets, getIo };
