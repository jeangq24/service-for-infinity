const logger = require("./logs");

const relations = (models) => {
    try {
        const { Person, User, Rol, Product, Schedule, Quote, QuoteProduct, Client } = models;
        // Relación uno a uno entre Person y User
        Person.hasOne(User, {
            foreignKey: 'personId',
            as: 'user'
        });
        User.belongsTo(Person, {
            foreignKey: 'personId',
            as: 'person'
        });

        // Relación uno a uno entre Person y Client
        Person.hasOne(Client, {
            foreignKey: 'personId',
            as: 'client'
        });

        Client.belongsTo(Person, {
            foreignKey: 'personId',
            as: 'person'
        });

        // Relación uno a muchos entre Rol y User
        Rol.hasMany(User, {
            foreignKey: 'rolId',
            as: 'user'
        });
        User.belongsTo(Rol, {
            foreignKey: 'rolId',
            as: 'rol'
        });

        // Relación uno a muchos entre User y Schedule
        User.hasMany(Schedule, {
            foreignKey: 'userId',
            as: 'shedule'
        });
        Schedule.belongsTo(User, {
            foreignKey: 'userId',
            as: 'user'
        });

        // Relación uno a muchos entre Client y Quote
        Client.hasMany(Quote, {
            foreignKey: 'clientId',
            as: 'quotes'
        });
        Quote.belongsTo(Client, {
            foreignKey: 'clientId',
            as: 'client'
        });

        // Relación uno a muchos entre User y Quote
        User.hasMany(Quote, {
            foreignKey: 'userId',
            as: 'quote'
        });
        Quote.belongsTo(User, {
            foreignKey: 'userId',
            as: 'user'
        });

        // Configurar la relación muchos a muchos
        Quote.belongsToMany(Product, {
            through: QuoteProduct,
            as: 'product',
            foreignKey: 'quoteId'
        });
        Product.belongsToMany(Quote, {
            through: QuoteProduct,
            as: 'quote',
            foreignKey: 'productId'
        });

    } catch (error) {
        logger.error(error);
        console.log(error)
    };
};

module.exports = relations;