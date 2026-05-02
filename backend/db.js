import mysql from "mysql2";

// 1. Create the base connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// 2. Convert it to use Promises (CRITICAL for 'await' in server.js)
const db = connection.promise();

export default db;
