const { DataTypes } = require('sequelize');
const logger = require('../lib/logs');
const { STRING, INTEGER, DATE } = DataTypes;
const QuoteProduct = (sequelize) => {
    try {
        sequelize?.define('QuoteProduct', {
            id: {
                type: INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true
            },
        }, {
            timestamps: true,
            hooks: {
                afterValidate: (quoteProduct, options) => {
                    logger.info(`Validation completed for quoteProduct: ${quoteProduct}`);
                }
            }
        });

        logger.info('QuoteProduct model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining QuoteProduct model:', error);
    }
};
module.exports = QuoteProduct;