const { DataTypes } = require('sequelize');
const logger = require('../lib/logs');
const { STRING, INTEGER, DATE } = DataTypes;
const Client = (sequelize) => {
    try {
        sequelize?.define('Client', {
            id: {
                type: INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true
            },
           

            comments: {
                type: STRING,
                allowNull: true,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The comments field cannot be empty'
                    }
                }
            },
        }, {
            timestamps: true,
            hooks: {
                afterValidate: (client, options) => {
                    logger.info(`Validation completed for client: ${client}`);
                }
            }
        });

        logger.info('Client model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining Client model:', error);
    }
};
module.exports = Client;
