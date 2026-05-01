import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDB() {
    try {
        console.log("Attempting to connect to MySQL as root...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log("Successfully connected! Reading schema.sql...");
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        console.log("Executing schema queries...");
        await connection.query(schema);

        console.log("SUCCESS: Database 'smart_vendor' and all tables generated properly!");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR initializing database:");
        if (error.code === 'ECONNREFUSED') {
            console.error("-> It looks like the MySQL server is NOT RUNNING on localhost:3306.");
            console.error("Please ensure XAMPP/WAMP or your MySQL service is started!");
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("-> Access denied! The username or password in .env might be incorrect.");
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

initializeDB();
