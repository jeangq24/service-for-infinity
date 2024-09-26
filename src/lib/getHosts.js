const {
    SERVER_PORT,
    SERVER_HOST,
    CLIENT_HOST,
    CLIENT_PORT
  } = process.env;

const server_port = SERVER_PORT || 3001;
const server_host = SERVER_HOST;
const client_host = CLIENT_HOST;
const client_port = CLIENT_PORT || 3000;

module.exports = {server_port, server_host, client_host, client_port};