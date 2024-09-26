const { DataTypes } = require('sequelize');
const logger = require('../lib/logs');
const { INTEGER, STRING , BOOLEAN} = DataTypes;
const Quote = (sequelize) => {
    try {
        sequelize?.define('Quote', {
            id: {
                type: INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true
            },
            start_time: {
                type: STRING,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The start time field cannot be empty'
                    }
                }
            },

            end_time: {
                type: STRING,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end time field cannot be empty'
                    }
                }
            },

            day: {
                type: INTEGER,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end time field cannot be empty'
                    }
                }
            },

            month: {
                type: INTEGER,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end time field cannot be empty'
                    }
                }
            },

            year: {
                type: INTEGER,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end time field cannot be empty'
                    }
                }
            },

            status: {
                type: BOOLEAN,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The status field cannot be empty'
                    }
                }
            }
        }, {
            timestamps: true,
            hooks: {
                afterValidate: (quote, options) => {
                    logger.info(`Validation completed for quote: ${quote}`);
                }
            }
        });

        logger.info('Quote model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining Quote model:', error);
    }
};
module.exports = Quote;
