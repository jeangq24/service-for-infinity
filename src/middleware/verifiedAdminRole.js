const { Rol } = require("../db.js");
const logger = require( "../lib/logs.js");
const verfiedAdminRole = async (req, res, next) => {
    const userData = req?.user;
    const checkRol = await Rol.findByPk(userData?.rol);

    if (checkRol.id !== "admin") {
        logger.info(`Does not have the administrator role`);
        return res.status(401).json({
            error: `Does not have the administrator role`,
            status: 401
        });
    };
    next();
};

module.exports = verfiedAdminRole;