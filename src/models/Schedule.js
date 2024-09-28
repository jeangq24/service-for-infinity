const { DataTypes } = require('sequelize');
const logger = require('../lib/logs');
const { INTEGER, BOOLEAN, STRING } = DataTypes;
const Schedule = (sequelize) => {
    try {
        sequelize?.define('Schedule', {
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
                allowNull: true,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The day field cannot be empty'
                    }
                }
            },

            month: {
                type: INTEGER,
                allowNull: true,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end month cannot be empty'
                    }
                }
            },

            year: {
                type: INTEGER,
                allowNull: true,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The end year cannot be empty'
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
            },

            default: {
                type: BOOLEAN,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: {
                        msg: 'The default field cannot be empty'
                    }
                }
            },
        }, {
            timestamps: true,
            hooks: {
                // Crear un objeto Date con los valores del schedule
                beforeCreate: (schedule, options) => {
                    if (!schedule?.default) {
                        const { day, month, year } = schedule;

                        // Crear un objeto Date con los valores del schedule
                        const scheduleDate = new Date(year, month - 1, day);
                        const currentDate = new Date();

                        // Obtener la fecha límite (dos meses en el futuro)
                        const maxDate = new Date();
                        maxDate.setMonth(currentDate.getMonth() + 2);

                        // Validar que la fecha no sea menor a la actual
                        if (scheduleDate < currentDate) {
                            logger.error('The date cannot be earlier than today');
                            throw new Error("The date cannot be earlier than today");

                        };

                        // Validar que la fecha no sea mayor a dos meses a partir de hoy
                        if (scheduleDate > maxDate) {
                            logger.error('The date cannot be more than two months in the future');
                            throw new Error("The date cannot be more than two months in the future");

                        };

                    }
                },
                afterCreate: (schedule, options) => {
                    logger.info(`Schedule created successfully: ${schedule}`);
                }

            }
        });

        logger.info('Schedule model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining Schedule model:', error);
    }
};
module.exports = Schedule;
