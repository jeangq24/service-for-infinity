const logger = require( "../lib/logs.js");

const verfiedUserLogin = (req, res, next) => {
    const userData = req?.user;
    let infoString = "Permission denied, authentication required";
    if (!userData) {
        logger.info(infoString);
        return res.status(401).json({
            error: infoString,
            status: 401
        });
    }
    next();
};

module.exports = verfiedUserLogin;