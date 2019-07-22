const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    ssl: true,
    define: {
      timestamps: false
    },
    dialectOption: {
      ssl: true,
      native: true
    },
    logging: false
  },
  test: {
    username: process.env.DB_TEST_USERNAME,
    password: process.env.DB_TEST_PASSWORD || '',
    database: process.env.DB_TEST_DATABASE,
    host: process.env.DB_TEST_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    ssl: true,
    define: {
      timestamps: false
    },
    dialectOption: {
      ssl: true,
      native: true
    },
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    port: 5432,
    ssl: true,
    operatorsAliases: false,
    dialectOption: {
      ssl: true,
      native: true
    }
  }
};
