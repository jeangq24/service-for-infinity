const { Router } = require('express');
const router = Router();
const logger = require('../lib/logs');
const { Product, Quote, User, Client, QuoteProduct } = require('../db.js');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/authenticateToken.js');
const emitQuotesList = require("../events/emitQuotesList.js");
const { validateMinutesInterval, validateTimeRange, validateTimeInterval, validateDateRange } = require("../lib/validateTime.js");

router.get('/', async (req, res) => {
    try {
        //const userData = req?.user;
        const quotesList = await emitQuotesList();

        return res.status(200).json({
            quotes: quotesList,
            status: 200
        });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error',
            status: 500
        });
    }
})
router.post('/', async (req, res) => {
    try {
        const { startTime, endTime, userId, day, month, year, clientId, status, products } = req.body;

        // Validaciones iniciales
        if (!startTime || !endTime || !userId || !day || !month || !year || !products?.length) {
            const missingFields = [];
            if (!startTime) missingFields.push('startTime');
            if (!endTime) missingFields.push('endTime');
            if (!userId) missingFields.push('userId');
            if (!day) missingFields.push('day');
            if (!month) missingFields.push('month');
            if (!year) missingFields.push('year');
            if (!products?.length) missingFields.push('products');

            logger.info(`Faltan los siguientes campos: ${missingFields.join(', ')}`);
            return res.status(400).json({
                error: `Faltan los siguientes campos: ${missingFields.join(', ')}`,
                status: 400
            });
        }

        // Validaciones de tiempo y fecha
        const timeValidation = validateTimeRange(startTime, endTime);
        if (!timeValidation.valid) return res.status(400).json({ error: timeValidation.message, status: 400 });

        const timeInterval = validateTimeInterval(startTime, endTime);
        if (!timeInterval.valid) return res.status(400).json({ error: timeInterval.message, status: 400 });

        const dateRange = validateDateRange(year, month, day);
        if (!dateRange.valid) return res.status(400).json({ error: dateRange.message, status: 400 });

        // Comprobar solapamientos
        const whereCondition = {
            day, month, year,
            [Op.or]: [{ userId }]
        };
        if (clientId) whereCondition[Op.or].push({ clientId });

        const quotes = await Quote.findAll({
            where: whereCondition,
            order: [['start_time', 'ASC']]
        });

        const overlap = quotes.some(quote => !(endTime <= quote.start_time || startTime >= quote.end_time));
        if (overlap) {

            return res.status(400).json({
                error: `El intervalo de tiempo ${startTime} - ${endTime} está ocupado para otra cita.`,
                status: 400
            });
        }

        // Consultas paralelas para User y Client
        const [user, client] = await Promise.all([
            User.findByPk(userId),
            clientId ? Client.findByPk(clientId) : null
        ]);

        // Crear la cita (Quote)
        const quoteCreated = await Quote.create({
            start_time: startTime,
            end_time: endTime,
            status: status ?? true,
            day, month, year
        });
      
        await quoteCreated.setUser(user);
        if (client) await quoteCreated.setClient(client);

        // Buscar productos y asociarlos
        const productsDb = await Product.findAll({ where: { id: { [Op.in]: products } } });
        await quoteCreated.addProduct(productsDb);
        logger.info("Cita creada con éxito");
        await emitQuotesList();
        return res.status(200).json({ quote: { ...quoteCreated.dataValues, products: productsDb }, status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Error interno del servidor', status: 500 });
    }
});




router.put('/', async (req, res) => {
    try {

        const { startTime, endTime, userId, day, month, year, clientId, status, products, quoteId } = req.body;

        // Validaciones iniciales
        if (!startTime && !endTime && !userId && !day && !month && !year && !products?.length) {
            const missingFields = [];
            if (!startTime) missingFields.push('startTime');
            if (!endTime) missingFields.push('endTime');
            if (!userId) missingFields.push('userId');
            if (!day) missingFields.push('day');
            if (!month) missingFields.push('month');
            if (!year) missingFields.push('year');
            if (!products?.length) missingFields.push('products');

            logger.info(`Faltan los siguientes campos: ${missingFields.join(', ')} o al menos uno`);
            return res.status(400).json({
                error: `Faltan los siguientes campos: ${missingFields.join(', ')} o al menos uno`,
                status: 400
            });
        }

        // Buscar la cita existente
        const quote = await Quote.findByPk(quoteId);
        if (!quote) {
            logger.info(`La cita con id ${quoteId} no fue encontrada`);
            return res.status(404).json({
                error: `La cita con id ${quoteId} no fue encontrada`,
                status: 404
            });
        }

        const currentDay = day || quote.day;
        const currentMonth = month || quote.month;
        const currentYear = year || quote.year;
        const currentStartTime = startTime || quote.start_time;
        const currentEndTime = endTime || quote.end_time;
        const currentUserId = userId || quote.userId
        const currentClientId = clientId || quote.clientId
        const currentStatus = status || quote.status;

        // Validaciones de tiempo y fecha
        const timeValidation = validateTimeRange(currentStartTime, currentEndTime);
        if (!timeValidation.valid) return res.status(400).json({ error: timeValidation.message, status: 400 });

        const timeInterval = validateTimeInterval(currentStartTime, currentEndTime);
        if (!timeInterval.valid) return res.status(400).json({ error: timeInterval.message, status: 400 });

        const dateRange = validateDateRange(currentYear, currentMonth, currentDay);
        if (!dateRange.valid) return res.status(400).json({ error: dateRange.message, status: 400 });

        // Comprobar solapamientos
        const whereCondition = {
            day: currentDay,
            month: currentMonth,
            year: currentYear,
            [Op.or]: [{ userId: currentUserId }],
            id: {
                [Op.ne]: quote.id // Excluir la cita actual
            }
        };
        if (currentClientId) whereCondition[Op.or].push({ clientId: currentClientId });

        const quotes = await Quote.findAll({
            where: whereCondition,
            order: [['start_time', 'ASC']]
        });

        const overlap = quotes.some(quote => !(currentEndTime <= quote.start_time || currentStartTime >= quote.end_time));
        if (overlap) {
            return res.status(400).json({
                error: `El intervalo de tiempo ${currentStartTime} - ${currentEndTime} está ocupado para otra cita.`,
                status: 400
            });
        }

        // Consultas paralelas para User y Client
        const [user, client] = await Promise.all([
            User.findByPk(currentUserId),
            currentClientId ? Client.findByPk(currentClientId) : null
        ]);

        // Actualizar la cita (Quote)
        await quote.update({
            start_time: currentStartTime,
            end_time: currentEndTime,
            status: currentStatus,
            day: currentDay,
            month: currentMonth,
            year: currentYear
        });

        await quote.setUser(user);
        if (client) await quote.setClient(client);

        // Actualizar los productos asociados
        let productsDb;
        if (products?.length > 0) {
            productsDb = await Product.findAll({ where: { id: { [Op.in]: products } } });
            await quote.setProduct(productsDb); // Este método actualiza la relación en la tabla intermedia

        } else {
            productsDb = (await QuoteProduct.findAll({ where: { quoteId: quoteId } }))
            productsDb = await Promise.all(productsDb.map(async (element) => {
                return Product.findByPk(element.productId)
            }));
        };

        logger.info("Cita actualizada con éxito");
        await emitQuotesList();
        return res.status(200).json({ quote: { ...quote.dataValues, products: productsDb }, status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Error interno del servidor', status: 500 });
    }
});

router.delete("/", async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            const messageError = "No quote id found in body";
            logger.info(messageError);
            return res.status(400).json({ error: messageError, status: 400 });

        };

        const quoteDb = await Quote.findByPk(id);
        if (!quoteDb) {
            logger.error('quote not found');
            return res.status(404).json({ error: 'quote not found', status: 404 });
        };

        await quoteDb.destroy();
        logger.info("quote deleted successfully");
        await emitQuotesList();
        return res.status(200).json({ shedule: quoteDb, message: 'quote deleted successfully', status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error',
            status: 500
        });
    }
});

module.exports = router;
