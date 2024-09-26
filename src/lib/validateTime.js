const logger = require("./logs")

const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const validateTimeRange = (startTime, endTime) => {
    const startInMinutes = timeToMinutes(startTime);
    const endInMinutes = timeToMinutes(endTime);

    // Verificar que el horario de inicio sea menor que el de fin
    if (startInMinutes >= endInMinutes) {
        return {
            valid: false,
            message: 'The startTime must be earlier than the endTime.'
        };
    }

    // Verificar que los tiempos estén en el rango de 01:00 a 24:00
    const minTime = timeToMinutes("01:00");
    const maxTime = timeToMinutes("24:00");

    if (startInMinutes < minTime || endInMinutes > maxTime) {
        return {
            valid: false,
            message: 'The times must be between 01:00 and 24:00.'
        };
    }

    return { valid: true };
};



const validateTimeInterval = (startTime, endTime) => {
    const timeRegex = /^(0[1-9]|1[0-9]|2[0-4]):(00|30)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        const infoString = 'Select a valid time for "startTime" and "endTime" between 01:00 and 24:00 in 30 minute intervals only';
        return {
            message: infoString,
            valid: false
        };
    };

    return { valid: true };
};

const validateDateRange = (year, month, day) => {
    // Crear un objeto Date con los valores del schedule
    const scheduleDate = new Date(year, month - 1, day);
    const currentDate = new Date();

    // Establecer la hora de ambas fechas a medianoche (00:00:00)
    scheduleDate.setHours(0, 0, 0, 0);


    // Obtener la fecha límite (dos meses en el futuro)
    const maxDate = new Date();
    maxDate.setMonth(currentDate.getMonth() + 2);
    maxDate.setHours(0, 0, 0, 0);
    // Validar que la fecha no sea menor a la actual
    if (scheduleDate < currentDate) {
        const infoString = 'The date cannot be earlier than today';
        logger.error(infoString);
        return {
            message: infoString,
            valid: false
        };

    };

    // Validar que la fecha no sea mayor a dos meses a partir de hoy
    if (scheduleDate > maxDate) {
        const infoString = "The date cannot be more than two months in the future";
        logger.error(infoString);
        return res.status(400).json({
            message: infoString,
            valid: false
        });
    };

    return { valid: true };
};

const validateMinutesInterval = (duration) => {
   
    if (duration < 0 || duration % 30 !== 0) {
        const infoString = "Minutes must be within a range of 30 minute intervals"
        return {
            valid: false,
            message:infoString
        };
      };

      return {valid: true};
}

module.exports = { timeToMinutes, validateTimeRange, validateTimeInterval, validateDateRange, validateMinutesInterval }
