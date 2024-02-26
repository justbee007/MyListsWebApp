const env = process.env;
const fs = require('fs');


const config = {
    db: {
        host: env.DB_HOST || 'localhost',
        user: env.DB_USER || 'postgres',
        password: env.DB_PASSWORD || 'Pass@123',
        database: env.DB_NAME || 'postgres',
        dialect: "postgres",
        port: 5432,
        schema: 'todo',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    METRICS_HOSTNAME: "localhost",
    METRICS_PORT: 8125,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
    }
}
};

module.exports = config;