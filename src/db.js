//Import required
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logger = require('./lib/logs');
const pg = require("pg");
const relations = require("./lib/relationshipSchemes.js");

//Data config conexion
const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_NAME,
  ENV_DEV
} = process.env;

let sequelize;

//Conexion DB
try {
  sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`, {
    logging: msg => logger.debug(msg),
    native: false,
    dialectModule: pg,
    dialectOptions: ENV_DEV ? null : {
      ssl: {
        rejectUnauthorized: false,
      },
      
    }
  });
  logger.info('Connection to the database has been established successfully.');
} catch (error) {
  logger.error('Unable to connect to the database:', error);
}

//Inject models
const modelsDir = path.join(__dirname, 'models');
const modelDefiners = [];

try {
  fs.readdirSync(modelsDir)
    .filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
    .forEach(file => {
      modelDefiners.push(require(path.join(modelsDir, file)));
    });
  logger.info('Models have been loaded successfully.');
} catch (error) {
  logger.error('Error loading models:', error);
}

try {
  modelDefiners.forEach(model => model(sequelize));
  sequelize.models = Object.entries(sequelize.models).reduce((acc, [name, model]) => {
    const capitalizedModelName = name.charAt(0).toUpperCase() + name.slice(1);
    acc[capitalizedModelName] = model;
    return acc;
  }, {});
  logger.info('Models have been defined and capitalized successfully.');
} catch (error) {
  logger.error('Error defining models:', error);
}


//Relations models
relations(sequelize.models);


//Module exports
module.exports = {
  ...sequelize.models,
  conn: sequelize,
};
