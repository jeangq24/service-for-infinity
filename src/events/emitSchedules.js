const { getIo } = require("../lib/socket.js");
const logger = require('../lib/logs.js');
const { Schedule } = require('../db.js');

const emitSchedulesList = async (userId) => {
    try {
        const socket = getIo();
        const schedulesList = await Schedule.findAll({
            where: {
                userId
            },
            order: [['createdAt', 'DESC']]
        });
        socket.emit('getScheduleList', schedulesList);
        logger.info('[ Socket::Event::getScheduleList ] - emit');
        return schedulesList;
    } catch (error) {
        logger.error(`Error getting Schedules list: ${error}`);
        return;
    }
};

module.exports = emitSchedulesList;