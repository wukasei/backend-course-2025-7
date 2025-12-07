const mysql = require('mysql2');
require('dotenv').config(); 

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'inventory_db_container',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'secret_password',
  database: process.env.DB_NAME || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool.promise();