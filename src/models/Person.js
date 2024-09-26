const { DataTypes } = require('sequelize');
const logger = require('../lib/logs');
const { STRING, INTEGER, DATE } = DataTypes;
const Person = (sequelize) => {
    try {
        sequelize?.define('Person', {
            id: {
                type: INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true
            },
            name: {
                type: STRING,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The name field cannot be empty'
                    }
                }
            },
            email: {
                type: STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: 'The email field cannot be empty'
                    },
                    isEmail: {
                        msg: 'Invalid email format'
                    }
                }
            },
            phone: {
                type: INTEGER,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: 'The phone field cannot be empty'
                    }
                }
            }
        }, {
            timestamps: true,
            hooks: {
                afterValidate: (person, options) => {
                    logger.info(`Validation completed for person: ${person}`);
                }
            }
        });

        logger.info('Person model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining Person model:', error);
    }
};
module.exports = Person;
