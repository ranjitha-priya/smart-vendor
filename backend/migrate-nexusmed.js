import db from './db.js';

async function migrate() {
    try {
        console.log("--- NexusMed Database Migration Starting ---");
        
        // 1. Add expiry_date to inventory
        console.log("Attempting to add expiry_date to inventory table...");
        try {
            await db.query(`ALTER TABLE inventory ADD COLUMN expiry_date DATE NULL AFTER batch_number;`);
            console.log("Column 'expiry_date' added.");
        } catch (e) {
            console.log("Column 'expiry_date' already exists or other error:", e.message);
        }

        // 2. Ensure drugs has critical_threshold
        console.log("Attempting to add critical_threshold to drugs table...");
        try {
            await db.query(`ALTER TABLE drugs ADD COLUMN critical_threshold INT DEFAULT 50 AFTER description;`);
            console.log("Column 'critical_threshold' added.");
        } catch (e) {
            console.log("Column 'critical_threshold' already exists or other error:", e.message);
        }

        console.log("--- Migration Process Finished ---");
        process.exit(0);
    } catch (error) {
        console.error("Migration Process Failed:", error.message);
        process.exit(1);
    }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
