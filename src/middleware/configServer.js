const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('../lib/logs.js');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const combineSwaggerFiles = require('../lib/combineSwaggerFiles.js');
const {client_host} = require("../lib/getHosts.js")
const rateLimit = require('express-rate-limit');

// Middleware logging
const morganLogging = morgan('dev', {
    stream: {
        write: message => logger.warn(message.trim())
    }
})


// Config middlewares
const bodyParserUrlencoded = bodyParser.urlencoded({ extended: true, limit: '50mb' });
const bodyParseJson = bodyParser.json({ limit: '50mb' });
const parserCookie = cookieParser();


// Config de CORS
const configCors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', `${client_host || "*"}`);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

    if (req.method === 'OPTIONS') {
        return res.status(204).end(); 
    };
    next();
};

// error handler
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || err;
    logger.error('Error:', err);
    res.status(status).send({
        error: {
            status,
            message,
        },
    });

    return;
};


// routes not found 

const notFoundHandler = (req, res) => {
    const status = 404;
    const message = 'Enpoint Not Found';
    logger.warn(`404 - Not Found - Endpoint: ${req.originalUrl.toString()} - Method: ${req.method.toString()}`);
    res.status(status).send({
        error: {
            status,
            message,
        },
    });

    return;
};


//Swagger config
const swaggerConfig = () => {
    const swaggerEndpoint = '/';
    const swaggerSpec = combineSwaggerFiles();
    return [
        swaggerEndpoint,
        swaggerUi.serve,
        swaggerUi.setup(swaggerJsDoc(
            swaggerSpec
        )),
    ]
}

//Rate limit 


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 solicitudes por 'window'
  message: {
    error:'Too many requests from this IP, please try again later.',
    status: 429
  },
  handler: (req, res, next, options) => {
    // Llama al logger para registrar el evento
    const logMessage = `Rate limit exceeded for IP: ${req.ip}.`;   
    // Puedes usar el logger que has definido
    logger.warn(logMessage);

    res.status(options.message.status).json(options.message);
  }
});

module.exports = {
    morganLogging, 
    bodyParserUrlencoded, 
    bodyParseJson, 
    parserCookie, 
    configCors, 
    errorHandler, 
    notFoundHandler, 
    swaggerConfig,
    limiter,
};
