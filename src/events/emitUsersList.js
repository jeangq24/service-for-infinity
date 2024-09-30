const { getIo } = require("../lib/socket.js");
const logger = require('../lib/logs.js');
const { User } = require('../db.js');

const emitUsersList = async () => {
    try {
        const socket = getIo();
        // Excluir el campo "password" de la consulta
        const usersList = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
            include: 'person'
        });
        socket.emit('getUsersList', usersList);
        logger.info('[ Socket::Event::getUsersList ] - emit');
        return usersList;
    } catch (error) {
        logger.error(`Error getting users list: ${error}`);
        return;
    }
};

module.exports = emitUsersList;
