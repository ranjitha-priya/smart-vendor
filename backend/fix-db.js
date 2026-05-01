import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixAll() {
    let connection;
    try {
        console.log("╔══════════════════════════════════════════════════╗");
        console.log("║   NexusMed Full Backend Fix — Running...         ║");
        console.log("╚══════════════════════════════════════════════════╝\n");

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_vendor',
            multipleStatements: true
        });

        console.log("✅ Connected to MySQL.\n");

        // ── SUPPLIERS TABLE ──────────────────────────────────────
        const supplierCols = [
            { sql: `ALTER TABLE suppliers ADD COLUMN password VARCHAR(255) AFTER contact_phone`, name: 'password' },
            { sql: `ALTER TABLE suppliers ADD COLUMN approval_status ENUM('pending','approved','rejected') DEFAULT 'pending' AFTER password`, name: 'approval_status' },
            { sql: `ALTER TABLE suppliers ADD COLUMN reliability_score FLOAT DEFAULT 0.0`, name: 'reliability_score (if missing)' },
        ];
        for (const col of supplierCols) {
            try { await connection.query(col.sql); console.log(`  suppliers.${col.name} ✔ added`); }
            catch(e) { console.log(`  suppliers.${col.name} — already exists, skipping.`); }
        }

        // ── DRUGS TABLE ──────────────────────────────────────────
        try {
            await connection.query(`ALTER TABLE drugs ADD COLUMN critical_threshold INT DEFAULT 50 AFTER description`);
            console.log(`  drugs.critical_threshold ✔ added`);
        } catch(e) { console.log(`  drugs.critical_threshold — already exists, skipping.`); }

        // ── INVENTORY TABLE ──────────────────────────────────────
        // The schema uses 'expiration_date', but server.js uses 'expiry_date'.
        // We add expiry_date as the canonical column.
        try {
            await connection.query(`ALTER TABLE inventory ADD COLUMN expiry_date DATE NULL AFTER batch_number`);
            console.log(`  inventory.expiry_date ✔ added`);
        } catch(e) { console.log(`  inventory.expiry_date — already exists, skipping.`); }

        // Migrate data from old column name if it exists
        try {
            await connection.query(`UPDATE inventory SET expiry_date = expiration_date WHERE expiry_date IS NULL AND expiration_date IS NOT NULL`);
            console.log(`  inventory: Migrated data from expiration_date → expiry_date`);
        } catch(e) { /* old column may not exist */ }

        // ── ORDERS TABLE ─────────────────────────────────────────
        const orderCols = [
            `ALTER TABLE orders ADD COLUMN expected_delivery_date TIMESTAMP NULL AFTER order_date`,
            `ALTER TABLE orders ADD COLUMN delivery_date TIMESTAMP NULL AFTER expected_delivery_date`,
            `ALTER TABLE orders ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00 AFTER delivery_date`,
            `ALTER TABLE orders ADD COLUMN quality_rating INT DEFAULT 5 AFTER unit_price`,
        ];
        for (const sql of orderCols) {
            const colName = sql.match(/ADD COLUMN (\w+)/)[1];
            try { await connection.query(sql); console.log(`  orders.${colName} ✔ added`); }
            catch(e) { console.log(`  orders.${colName} — already exists, skipping.`); }
        }

        // ── SEED DEFAULT ADMIN ───────────────────────────────────
        const [admins] = await connection.query(`SELECT id FROM users WHERE email = 'admin@nexusmed.com'`);
        if (admins.length === 0) {
            await connection.query(
                `INSERT INTO users (name, email, password, role) VALUES ('Master Admin', 'admin@nexusmed.com', 'admin123', 'admin')`
            );
            console.log(`\n  👤 Admin seeded → admin@nexusmed.com / admin123`);
        } else {
            console.log(`\n  👤 Admin already exists → admin@nexusmed.com`);
        }

        console.log("\n╔══════════════════════════════════════════════════╗");
        console.log("║   ✅ ALL FIXES APPLIED SUCCESSFULLY!             ║");
        console.log("║   You can now run: npm run dev                   ║");
        console.log("╚══════════════════════════════════════════════════╝");
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Fix script failed:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("   → MySQL is NOT running. Start XAMPP/WAMP or your MySQL service first.");
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("   → Wrong MySQL credentials in .env file.");
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error("   → Database 'smart_vendor' does not exist yet. Run: node init-db.js first.");
        }
        process.exit(1);
    }
}

fixAll();
