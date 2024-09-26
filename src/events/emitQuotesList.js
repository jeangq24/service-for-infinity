const { getIo } = require("../lib/socket.js");
const logger = require('../lib/logs.js');
const { Product, QuoteProduct,Quote } = require('../db.js');
const { Op } = require('sequelize');

const emitProductsList = async () => {
    try {
        const socket = getIo();
        
        // Obtener todas las citas
        let quotes = await Quote.findAll();
        
        // Obtener todos los QuoteProducts relacionados a las citas en una sola consulta
        let quoteIds = quotes.map(quote => quote.id);
        let quoteProducts = await QuoteProduct.findAll({
            where: {
                quoteId: { [Op.in]: quoteIds }
            }
        });

        // Crear un diccionario para agrupar productos por cita
        const quoteProductsMap = {};
        quoteProducts.forEach(quoteProduct => {
            if (!quoteProductsMap[quoteProduct.quoteId]) {
                quoteProductsMap[quoteProduct.quoteId] = [];
            }
            quoteProductsMap[quoteProduct.quoteId].push(quoteProduct.productId);
        });

        // Obtener todos los productos que coinciden con las citas en una sola consulta
        let productIds = [...new Set(quoteProducts.map(qp => qp.productId))]; // Eliminar duplicados
        let products = await Product.findAll({
            where: {
                id: { [Op.in]: productIds }
            }
        });

        // Crear un diccionario de productos para fácil acceso
        const productsMap = {};
        products.forEach(product => {
            productsMap[product.id] = product;
        });

        // Mapear cada cita con sus productos
        quotes = quotes.map(quote => {
            const productsForQuote = (quoteProductsMap[quote.id] || []).map(productId => productsMap[productId]);
            return { quote, products: productsForQuote };
        });

        // Emitir la lista de citaas y productos
        socket.emit('QuotesList', quotes);
        logger.info('[ Socket::Event::QuotesList ] - emit');
        return quotes;
    } catch (error) {
        logger.error(`Error getting product list: ${error}`);
        return;
    }
};


module.exports = emitProductsList;