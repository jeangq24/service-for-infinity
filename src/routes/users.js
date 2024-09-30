const { Router } = require('express');
const router = Router();
const logger = require('../lib/logs');
const { Person, User, Rol, Schedule } = require('../db');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/authenticateToken.js');
const verfiedAdminRole = require("../middleware/verifiedAdminRole.js");
const emitUsersList = require("../events/emitUsersList.js")
router.post('/', async (req, res) => {
    try {
        const { name, phone, username, email, password, rol } = req.body;

        // Validación de campos vacíos
        if (!name || !phone || !username || !email || !password || !rol) {
            logger.info('Error. No se han enviado los datos necesarios: nombre, teléfono, rol, nombre de usuario, correo electrónico y contraseña.');
            return res.status(400).json({
                error: 'Error. No se han enviado los datos necesarios: nombre, teléfono, rol, nombre de usuario, correo electrónico y contraseña.',
                status: 400
            });
        }

        // Validación de longitud de la contraseña
        if (password.length < 4 || password.length > 20) {
            logger.info('La longitud de la contraseña debe estar entre 4 y 20 caracteres');
            return res.status(400).json({
                error: 'La longitud de la contraseña debe estar entre 4 y 20 caracteres',
                status: 400
            });
        }

        // Verificación de que el nombre de usuario no exista
        const existsUser = await User.findOne({ where: { username } });
        if (existsUser) {
            logger.info('El nombre de usuario ya existe, por favor selecciona otro.');
            return res.status(409).json({
                error: 'El nombre de usuario ya existe, por favor selecciona otro.',
                status: 409
            });
        }

        // Verificación de que el teléfono no exista
        const existsPhone = await Person.findOne({ where: { phone } });
        if (existsPhone) {
            logger.info('El número de teléfono ya está registrado, por favor proporciona uno diferente.');
            return res.status(409).json({
                error: 'El número de teléfono ya está registrado, por favor proporciona uno diferente.',
                status: 409
            });
        }

        // Verificación de que el correo electrónico no exista
        const existsEmail = await Person.findOne({ where: { email } });
        if (existsEmail) {
            logger.info('El correo electrónico ya está registrado, por favor proporciona uno diferente.');
            return res.status(409).json({
                error: 'El correo electrónico ya está registrado, por favor proporciona uno diferente.',
                status: 409
            });
        }

        // Verificación de que el rol proporcionado exista
        const existsRol = await Rol.findOne({ where: { id: rol.toLowerCase() } });
        if (!existsRol) {
            logger.info('El rol proporcionado no existe.');
            return res.status(404).json({
                error: 'El rol proporcionado no existe.',
                status: 404
            });
        }

        // Creación de la persona y usuario
        const createdPerson = await Person.create({ name, phone, email });
        const createdUser = await User.create({ username, password });
        await createdUser.setPerson(createdPerson);
        await createdUser.setRol(existsRol);

        // Configuración de la contraseña para no devolverla
        createdUser.password = null;

        // Creación del horario predeterminado
        const createdScheduleDefault = await Schedule.create({
            start_time: "07:00",
            end_time: "20:00",
            status: true,
            day: null,
            month: null,
            year: null,
            default: true
        });
        await createdScheduleDefault.setUser(createdUser);

        // Emitir la lista actualizada de usuarios
        await emitUsersList();

        // Respuesta de éxito
        return res.status(200).json({
            user: createdUser,
            status: 200
        });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Error interno del servidor',
            status: 500
        });
    }
});


router.put('/', authenticateToken, verfiedAdminRole, async (req, res) => {
    try {
        const { name, phone, username, email, password, rol, id } = req.body;

        // Verificar si se ha enviado al menos un campo para actualizar
        if (!name && !phone && !username && !email && !password && !rol) {
            logger.info('Debe proporcionarse al menos un campo para actualizar.');
            return res.status(400).json({
                error: 'Debe proporcionarse al menos un campo para actualizar.',
                status: 400
            });
        }

        // Encontrar al usuario por ID
        const user = await User.findOne({
            where: { id },
            include: 'person' // Incluir datos del modelo Person
        });

        if (!user) {
            logger.info(`Usuario con id ${id} no encontrado.`);
            return res.status(404).json({
                error: 'Usuario no encontrado.',
                status: 404
            });
        }

        // Validaciones para campos únicos solo si se envían
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
                logger.info('El nombre de usuario ya está en uso por otro usuario.');
                return res.status(409).json({
                    error: 'El nombre de usuario ya está en uso por otro usuario.',
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
                            ].filter(Boolean) // Filtra los valores null
                        }
                    ]
                }
            });

            if (existingPerson) {
                logger.info('El correo electrónico o el teléfono ya están en uso por otra persona.');
                return res.status(409).json({
                    error: 'El correo electrónico o el teléfono ya están en uso por otra persona.',
                    status: 409
                });
            }
        }

        // Verificación del rol proporcionado (si se envía)
        if (rol) {
            const existsRol = await Rol.findOne({ where: { id: rol.toLowerCase() } });
            if (!existsRol) {
                logger.info('El rol proporcionado no existe.');
                return res.status(404).json({
                    error: 'El rol proporcionado no existe.',
                    status: 404
                });
            }
            await user.setRol(existsRol); // Asignar el nuevo rol si se envía
        }

        // Actualizar los campos del modelo User si se envían
        if (username) user.username = username;

        // Actualizar la contraseña solo si se envía y es diferente
        if (password && password !== user.password) {
            if (password.length < 4 || password.length > 20) {
                logger.info('La longitud de la contraseña debe estar entre 4 y 20 caracteres.');
                return res.status(400).json({
                    error: 'La longitud de la contraseña debe estar entre 4 y 20 caracteres.',
                    status: 400
                });
            }
            user.password = password;
        }

        // Actualizar los campos del modelo Person si se envían
        const person = user.person;
        if (name) person.name = name;
        if (phone) person.phone = phone;
        if (email) person.email = email;
        await person.save();

        await user.save(); // Guardar los cambios en el usuario

        // Ocultar la contraseña en la respuesta
        user.password = null;
        await emitUsersList();

        return res.status(200).json({
            user,
            status: 200
        });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Error interno del servidor.',
            status: 500
        });
    }
});


router.get('/', authenticateToken, verfiedAdminRole, async (req, res) => {
    try {
        const usersList = await emitUsersList();
        await emitUsersList();
        res.status(200).json({ usersList: [...usersList], status: 200 });
    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Error interno del servidor.', status: 500 });
    };
});


router.delete('/', authenticateToken, verfiedAdminRole, async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            const messageError = "No se encontró el ID de usuario en los parámetros de la consulta.";
            logger.info(messageError);
            return res.status(400).json({ error: messageError, status: 400 });
        }

        const user = await User.findByPk(id);
        if (!user) {
            logger.error('Usuario no encontrado.');
            return res.status(404).json({ error: 'Usuario no encontrado.', status: 404 });
        }
        
        await user.destroy();
        logger.info("Usuario eliminado con éxito.");
        await emitUsersList();
        return res.status(200).json({ message: 'Usuario eliminado con éxito.', status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Error interno del servidor.', status: 500 });
    }
});


module.exports = router;

