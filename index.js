const { socketServer} = require('./src/app.js');
const { conn, Rol } = require('./src/db.js');
const logger = require('./src/lib/logs.js');
const {server_host, server_port} = require("./src/lib/getHosts.js");

conn.sync({ force: false })
  .then(() => {
    socketServer.listen(server_port, async() => {
      logger.info(`Server is listening in: ${server_host}`);
      const existingRoles = await Rol.findAll();
      if (existingRoles.length === 0) {

        const defaultRoles = [
          { id: 'admin', status: true },
          { id: 'employee', status: true },
        ];

        await Rol.bulkCreate(defaultRoles);
        logger.info('Default roles have been added successfully.');
        
      } else {
        logger.info('Roles already exist in the database.');
      };
    });
  })
  .catch(err => {
    logger.error('Error syncing models or starting server:', err);
  });

 