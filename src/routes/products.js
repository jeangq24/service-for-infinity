const { Router } = require('express');
const router = Router();
const logger = require('../lib/logs');
const { Product } = require('../db.js');
const authenticateToken = require('../middleware/authenticateToken.js');
const emitProductsList = require("../events/emitProducstList.js");
const { validateMinutesInterval } = require("../lib/validateTime.js");

router.post('/', async (req, res) => {
    try {

        const { name, duration, price } = req?.body;

        if (!name || !duration || !price) {
            logger.info(`Failed. The data necessary for this request has not been sent: name duration price`);
            return res.status(400).json({
                error: `Failed. The data necessary for this request has not been sent: name duration price`,
                status: 400
            });
        };

        const minuteInterval = validateMinutesInterval(duration);
        if (!minuteInterval?.valid) {
            return res.status(400).json({
                error: minuteInterval.message,
                status: 400
            });
        };
        if (typeof price !== 'number') {
            logger.info('The price is not a valid value');
            return res.status(400).json({
                error: 'The price is not a valid value',
                status: 400
            });
        };

        const createdProduct = await Product.create({ name, price, duration_minutes: duration });
        logger.info('Successfully created product');
        await emitProductsList();
        res.status(200).json({ message: 'Successfully created product', product: createdProduct, status: 200 });

    } catch (error) {

        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Internal server error', status: 500 });
    }
});



router.get('/', async (req, res) => {
    try {
        const productsList = await emitProductsList();
        res.status(200).json({ productsList: [...productsList], status: 200 });
    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Internal server error', status: 500 });
    }
});


router.put('/', async (req, res) => {
    try {

        const { id, name, duration, price } = req?.body;
        if (!id) {
            const messageError = "No product id found in query parameters";
            logger.info(messageError);
            return res.status(400).json({ error: messageError, status: 400 });

        };
       
        const product = await Product.findByPk(id);

        if (!product) {
            logger.error('Product not found');
            return res.status(404).json({ error: 'Product not found', status: 404 });
        };

        const currentPrice = price || product.price;
        const currentDuration =  duration || product.duration_minutes;

        const minuteInterval = validateMinutesInterval(duration);
        if (!minuteInterval?.valid) {
            return res.status(400).json({
                error: minuteInterval.message,
                status: 400
            });
        };
        if (typeof price !== 'number') {
            logger.info('The price is not a valid value');
            return res.status(400).json({
                error: 'The price is not a valid value',
                status: 400
            });
        };

        product.name = name || product.name;
        product.duration_minutes = currentDuration
        product.price =  currentPrice
        await product.save();

        logger.info('The product was successfully updated');
        await emitProductsList();
        return res.status(200).json({ product: { ...product?.dataValues }, status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Internal server error', status: 500 });
    };
});


router.delete('/', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            const messageError = "No product id found in query parameters";
            logger.info(messageError);
            return res.status(400).json({ error: messageError, status: 400 });

        };

        const product = await Product.findByPk(id);
        if (!product) {
            logger.error('Product not found');
            return res.status(404).json({ error: 'Product not found', status: 404 });
        };
        await product.destroy();
        logger.info("Product deleted successfully");
        await emitProductsList();
        return res.status(200).json({ message: 'Product deleted successfully and history saved', status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Internal server error', status: 500 });
    };
});


router.delete('/all', async (req, res) => {
    try {
        const products = await Product.findAll();
        if (products.length === 0) {
            return res.status(200).json({ message: 'No products to delete', status: 200 });
        };

        await Product.destroy({ where: {}, truncate: false });

        logger.info('All products successfully deleted');
        await emitProductsList();
        return res.status(200).json({ message: 'All products successfully deleted', status: 200 });
    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Internal server error', status: 500 });
    }
});

module.exports = router;