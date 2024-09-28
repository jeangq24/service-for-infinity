const { getIo } = require("../lib/socket.js");
const logger = require('../lib/logs.js');
const { Product } = require('../db.js');

const emitProductsList = async () => {
    try {
        const socket = getIo();
        const productsList = await Product.findAll({
            order: [['createdAt', 'DESC']]
        });
        socket.emit('updateProductList', productsList);
        logger.info('[ Socket::Event::updateProductList ] - emit');
        return productsList;
    } catch (error) {
        logger.error(`Error getting product list: ${error}`);
        return;
    }
};

module.exports = emitProductsList;