const { Router } = require('express');
const router = Router();
const logger = require('../lib/logs.js');
const { Schedule, User } = require('../db.js');
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';
const { Op } = require('sequelize');
const authenticateToken = require("../middleware/authenticateToken.js");
const emitSchedulesList = require("../events/emitSchedules.js");
const verifiedUserLogin = require("../middleware/verfiedUserLogin.js");
const { validateTimeRange, validateTimeInterval, validateDateRange } = require("../lib/validateTime.js");

router.get('/', authenticateToken, verifiedUserLogin, async (req, res) => {
    try {
        const userData = req?.user;
        const schedulesList = await emitSchedulesList(userData?.id);

        return res.status(200).json({
            schedules: schedulesList,
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


router.post('/', authenticateToken, verifiedUserLogin, async (req, res) => {
    try {
        const userData = req?.user;
        const { startTime, endTime, status, day, month, year } = req?.body;


        let infoString;
        //valida datos obtenidos por el cuerpo
        if (!startTime || !endTime) {
            infoString = 'Provide a valid "startTime" and "endTime" in the body.';
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        };

        if (!day || !month || !year) {
            infoString = 'Provide a valid "day", "month" and "year" in the Object date.';
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        }

        // Validar rango de tiempo
        const timeRange = validateTimeRange(startTime, endTime);
        if (!timeRange.valid) {
            return res.status(400).json({
                error: timeRange.message,
                status: 400
            });
        };

        //validar rango de intervalo de minutos (30min) para cada hora
        const timeInterval = validateTimeInterval(startTime, endTime);
        if (!timeInterval.valid) {

            return res.status(400).json({
                error: timeInterval.message,
                status: 400
            });
        };

        //Validar rango de fechas para dos meses desde la fecha actual
        const dateRange = validateDateRange(year, month, day);

        if (!dateRange.valid) {

            return res.status(400).json({
                error: dateRange.message,
                status: 400
            });
        };

        //valida que la fecha no exista en un horario definido
        const schedulesWhereDate = await Schedule.findAll({
            where: {
                [Op.or]: [
                    {
                        userId: userData.id,
                        day,
                        month,
                        year,
                    },
                ]
            }
        });

        if (schedulesWhereDate.length > 0) {
            infoString = `There is already a schedule for this date: ${day}-${month}-${year}`
            logger.error(infoString);
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        };

        //Creacion se horario
        const promisesAllData = await Promise.all([
            User.findByPk(userData.id),
            Schedule.create({
                start_time: startTime,
                end_time: endTime,
                status: status ? status : true,
                day,
                month,
                year,
                default: false
            })
        ]);

        const [userDb, createdSchedule] = promisesAllData;

        if (userDb) {
            if (createdSchedule) {
                await createdSchedule?.setUser(userDb);
                logger.info("Schedule created");
            };
        };

        //dispara el evento que emite la lista de horarios en tiempo real para el usuario
        await emitSchedulesList(userDb.id);

        return res.status(200).json({
            shedule: createdSchedule,
            status: 200
        });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error',
            status: 500
        });
    };
});


router.put('/', authenticateToken, verifiedUserLogin, async (req, res) => {
    try {
        const { id, startTime, endTime, status, day, month, year } = req.body;
        let infoString = "Please provide a valid schedule id";
        if (!id) {
            logger.error(infoString);
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        };

        const scheduleDb = await Schedule.findByPk(id);

        if(scheduleDb?.default) {
            infoString = "No es posible editar el horario predeterminado";
            logger.error(infoString);
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        };

        const currentDay = day || scheduleDb.day;
        const currentMonth = month || scheduleDb.month;
        const currentYear = year || scheduleDb.year;
        const currentStartTime = startTime || scheduleDb.start_time;
        const currentEndTime = endTime || scheduleDb.end_time;

        // Validar rango de tiempo
        const timeValidation = validateTimeRange(currentStartTime, currentEndTime);
        if (!timeValidation.valid) {
            return res.status(400).json({
                error: timeValidation.message,
                status: 400
            });
        };

        //validar rango de intervalo de minutos (30min) para cada hora
        const timeInterval = validateTimeInterval(currentStartTime, currentEndTime);
        if (!timeInterval.valid) {

            return res.status(400).json({
                error: timeInterval.message,
                status: 400
            });
        };

        //Validar rango de fechas para dos meses desde la fecha actual
        const dateRange = validateDateRange(currentYear, currentMonth, currentDay);

        if (!dateRange.valid) {

            return res.status(400).json({
                error: timeInterval.message,
                status: 400
            });
        };

        //valida que la fecha no exista en un horario definido
        const schedulesWhereDate = await Schedule.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                userId: scheduleDb.userId,
                                day,
                                month,
                                year,
                            },
                        ],
                    },
                    {
                        id: {
                            [Op.ne]: scheduleDb.id, // Excluir registro con este ID
                        },
                    },
                ],
            },
        });


        if (schedulesWhereDate.length > 0) {
            infoString = `There is already a schedule for this date: ${day}-${month}-${year}`
            logger.error(infoString);
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        }

        //Actualiza el horario
        scheduleDb.start_time = currentStartTime
        scheduleDb.end_time = currentEndTime
        scheduleDb.status = status || scheduleDb.status;
        scheduleDb.day = currentDay;
        scheduleDb.month = currentMonth;
        scheduleDb.year = currentYear;
        scheduleDb.default = false;
        await scheduleDb.save();

        logger.info('The schedule was successfully updated');
        await emitSchedulesList(scheduleDb.userId);
        return res.status(200).json({
            schedule: scheduleDb,
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


router.delete("/", authenticateToken, verifiedUserLogin, async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            const messageError = "No schedule id found in body";
            logger.info(messageError);
            return res.status(400).json({ error: messageError, status: 400 });

        };

        const scheduleDb = await Schedule.findByPk(id);
        if (!scheduleDb) {
            logger.error('Schedule not found');
            return res.status(404).json({ error: 'Schedule not found', status: 404 });
        };

        if(scheduleDb?.default) {
            infoString = "No es posible eliminar el horario predeterminado";
            logger.error(infoString);
            return res.status(400).json({
                error: infoString,
                status: 400
            });
        };

        await scheduleDb.destroy();
        logger.info("Schedule deleted successfully");
        await emitSchedulesList(scheduleDb.userId);
        return res.status(200).json({ shedule: scheduleDb, message: 'Schedule deleted successfully', status: 200 });

    } catch (error) {
        logger.error(`Error: ${error}`);
        return res.status(500).json({
            error: 'Internal server error',
            status: 500
        });
    }
});


module.exports = router;