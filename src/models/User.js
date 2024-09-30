const { DataTypes } = require('sequelize');
const { STRING, INTEGER } = DataTypes;
const logger = require('../lib/logs');
const bcrypt = require('bcrypt');

const User = (sequelize) => {
    try {
        sequelize?.define('User', {
            id: {
                type: INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true,
            },
            username: {
                type: STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        msg: 'The username field cannot be empty'
                    },
                    len: {
                        args: [4, 20],
                        msg: 'The username must be between 4 and 20 characters long'
                    }
                }
            },
            password: {
                type: STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'The password field cannot be empty'
                    },
                    // Quitamos la validación de longitud aquí, la validaremos manualmente
                }
            }
        }, {
            timestamps: true,
            hooks: {
                beforeCreate: async (user, options) => {
                    logger.info(`Hashing password for user: ${user.username}`);

                    // Validar longitud de la contraseña antes de hashear
                    if (user.password.length < 4 || user.password.length > 20) {
                        throw new Error('The password must be between 4 and 20 characters long');
                    }

                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                },
                afterCreate: (user, options) => {
                    logger.info(`User created successfully: ${user.username}`);
                },
                beforeUpdate: async (user, options) => {
                    // Solo hashear la contraseña si ha sido modificada
                    if (user.changed('password')) {
                        logger.info(`Hashing updated password for user: ${user.username}`);

                        // Validar longitud de la contraseña antes de hashear
                        if (user.password.length < 4 || user.password.length > 20) {
                            throw new Error('The password must be between 4 and 20 characters long');
                        }

                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
                afterUpdate: (user, options) => {
                    logger.info(`User updated successfully: ${user.username}`);
                }
            }
        });

        logger.info('User model has been defined successfully.');
    } catch (error) {
        logger.error('Error defining User model:', error);
    }
};

module.exports = User;
