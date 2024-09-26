//Import required
const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../lib/logs');

const router = Router();
const routesDir = path.join(__dirname);


//Generated routes
fs.readdirSync(routesDir)
  .filter(file => file !== 'index.js' && file.slice(-3) === '.js')
  .forEach(file => {
    try {
      const route = require(path.join(routesDir, file));
      const routeName = file.split('.')[0];
      router.use(`/${routeName}`, route);
      logger.info(`Route /${routeName} has been loaded successfully.`);
    } catch (error) {
      logger.error(`Error loading route /${file}:`, error);
    }
  });

//Exports modules
module.exports = router;
