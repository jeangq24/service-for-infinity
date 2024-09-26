const { Router } = require('express');
const router = Router();
const logger = require('../lib/logs');
const { Person, User, Rol } = require('../db');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/authenticateToken.js');
const verfiedAdminRole = require("../middleware/verifiedAdminRole.js");

router.post('/',  async (req, res) => {
    try {
        const { name, phone, username, email, password, rol } = req?.body;

        if (!name || !phone || !username || !email || !password || !rol) {
            logger.info(`Failed. The data necessary for this request has not been sent: name, phone, rol, username, email and password.`);
            return res.status(400).json({
                error: `Failed. The data necessary for this request has not been sent: name, phone, rol, username, email and password.`,
                status: 400
            });

        };

        if (password.length < 4 || password.length > 20) {
            logger.info(`password length is 8 to 30 characters`);
            return res.status(400).json({
                error: `password length is 8 to 30 characters`,
                status: 400
            });
        }

        const exitsUser = await User.findAll({
            where: {
                [Op.or]: [
                    { username },
                ]
            }
        });


        if (exitsUser?.length > 0) {
            logger.info(`The user already exists, please select another username.`);
            return res.status(409).json({
                error: 'The user already exists, please select another username.',
                status: 409
            });
        };

        const existsRol = await Rol.findOne({ where: { id: rol.toLowerCase() } });
        if (!existsRol) {
            logger.info(`The provided role does not exist`);
            return res.status(404).json({
                error: 'The provided role does not exist',
                status: 404
            });
        };

        const createdPerson = await Person.create({ name, phone, email });
        const createdUser = await User.create({ username, password });
        await createdUser.setPerson(createdPerson);
        await createdUser.setRol(existsRol);
        createdUser.password = null;
        return res.status(200).json({
            user: createdUser,
            status: 200
        });

    } catch (error) {

        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error: ',
            status: 500
        });
    }
});

router.put('/', authenticateToken, verfiedAdminRole, async (req, res) => {
    try {

        const { name, phone, username, email, password, rol, id } = req?.body;

        // Verificar si al menos un campo (además del id) fue enviado
        if (!name && !phone && !username && !email && !password && !rol) {
            logger.info(`At least one field to update must be provided.`);
            return res.status(400).json({
                error: 'At least one field to update must be provided.',
                status: 400
            });
        }
        // Encontrar al usuario por id
        const user = await User.findOne({
            where: { id },
            include: 'person'  // Incluir los datos del modelo Person
        });


        if (!user) {
            logger.info(`User with id ${id} not found.`);
            return res.status(404).json({
                error: 'User not found',
                status: 404
            });
        }

        // Validación de campos únicos solo si se envían
        if (username) {
            const existingUser = await User.findOne({
                where: {
                    [Op.and]: [
                        { id: { [Op.ne]: user.id } }, // Excluir el usuario actual
                        { username }
                    ]
                }
            });

            if (existingUser) {
                logger.info(`The username is already in use by another user.`);
                return res.status(409).json({
                    error: 'The username is already in use by another user.',
                    status: 409
                });
            }
        }

        if (email || phone) {
          
            const existingPerson = await Person.findOne({
                where: {
                    [Op.and]: [
                        { id: { [Op.ne]: user.person.id } }, // Excluir la persona actual vinculada al usuario
                        {
                            [Op.or]: [
                                email ? { email } : null,
                                phone ? { phone } : null
                            ].filter(Boolean) // Filtra null si no se envía email o phone
                        }
                    ]
                }
            });
            if (existingPerson) {
                logger.info(`The email or phone is already in use by another person.`);
                return res.status(409).json({
                    error: 'The email or phone is already in use by another person.',
                    status: 409
                });
            }
        }

        // Verificar si el rol proporcionado existe (si se envía)
        if (rol) {
            const existsRol = await Rol.findOne({ where: { id: rol.toLowerCase() } });
            if (!existsRol) {
                logger.info(`The provided role does not exist`);
                return res.status(404).json({
                    error: 'The provided role does not exist',
                    status: 404
                });
            }
            await user.setRol(existsRol); // Asignar el nuevo rol si se envía
        }

        // Actualizar los campos del modelo User solo si se envían
        if (username) user.username = username;

        // Actualizar la contraseña solo si es diferente y se envía
        if (password && password !== user.password) {
            if (password.length < 4 || password.length > 20) {
                logger.info(`Password length should be between 4 and 20 characters`);
                return res.status(400).json({
                    error: 'Password length should be between 4 and 20 characters',
                    status: 400
                });
            }
            user.password = password;
        }

        // Actualizar los campos del modelo Person solo si se envían
        const person = user.person;
        if (name) person.name = name;
        if (phone) person.phone = phone;
        if (email) person.email = email;
        await person.save();

        await user.save(); // Guardar los cambios en el usuario

        // Ocultar la contraseña en la respuesta
        user.password = null;

        return res.status(200).json({
            user,
            status: 200
        });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error',
            status: 500
        });
    }
});

module.exports = router;

