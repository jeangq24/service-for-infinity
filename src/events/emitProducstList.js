const { getIo } = require("../lib/socket.js");
const logger = require('../lib/logs.js');
const { Product } = require('../db.js');

const emitProductsList = async () => {
    try {
        const socket = getIo();
        const productsList = await Product.findAll({order: [['createdAt', 'DESC']]});
        socket.emit('getServicesList', productsList);
        logger.info('[ Socket::Event::getServicesList ] - emit');
        return productsList;
    } catch (error) {
        logger.error(`Error getting product list: ${error}`);
        return;
    }
};

module.exports = emitProductsList;