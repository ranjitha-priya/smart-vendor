import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function clearAllData() {
    let connection;
    try {
        console.log("╔══════════════════════════════════════════════════╗");
        console.log("║   NexusMed — Clear All Data (Keep Admin)         ║");
        console.log("╚══════════════════════════════════════════════════╝\n");

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_vendor',
            multipleStatements: true
        });

        console.log("✅ Connected to MySQL.\n");

        // Disable foreign key checks so we can truncate in any order
        await connection.query(`SET FOREIGN_KEY_CHECKS = 0`);

        // Clear all transactional / relational tables
        const tables = ['orders', 'inventory', 'drugs', 'suppliers'];
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
            console.log(`  🗑️  ${table} — cleared`);
        }

        // Clear users EXCEPT admin accounts
        const [deleted] = await connection.query(`DELETE FROM users WHERE role != 'admin'`);
        console.log(`  🗑️  users — cleared (non-admin rows removed: ${deleted.affectedRows})`);

        // Re-enable foreign keys
        await connection.query(`SET FOREIGN_KEY_CHECKS = 1`);

        // Show what admin accounts remain
        const [admins] = await connection.query(`SELECT name, email, role FROM users`);
        console.log("\n  👤 Remaining admin accounts:");
        admins.forEach(a => console.log(`     → ${a.name} (${a.email}) [${a.role}]`));

        console.log("\n╔══════════════════════════════════════════════════╗");
        console.log("║   ✅ ALL DATA CLEARED — ADMIN PRESERVED          ║");
        console.log("╚══════════════════════════════════════════════════╝");
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Clear failed:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("   → MySQL is NOT running. Start XAMPP/WAMP first.");
        }
        // Always re-enable FK checks even on failure
        if (connection) {
            await connection.query(`SET FOREIGN_KEY_CHECKS = 1`).catch(() => {});
            await connection.end().catch(() => {});
        }
        process.exit(1);
    }
}

clearAllData();
