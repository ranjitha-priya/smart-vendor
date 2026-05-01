import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import db from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'Backend is running' }));

// -----------------------------------------
// Authentication Routes (Admin & Supplier)
// -----------------------------------------
app.post('/api/auth/register-supplier', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        // Check if email already exists
        const [existing] = await db.query('SELECT id FROM suppliers WHERE contact_email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: "Supplier email already registered." });

        await db.query(
            'INSERT INTO suppliers (name, contact_email, contact_phone, password, approval_status) VALUES (?, ?, ?, ?, "pending")',
            [name, email, phone, password]
        );
        res.status(201).json({ message: "Registration successful. Awaiting Admin Approval." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body; // role specifies login intent

        if (role === 'admin') {
            const [users] = await db.query('SELECT id, name, role FROM users WHERE email = ? AND password = ?', [email, password]);
            if (users.length === 0) return res.status(401).json({ error: "Invalid Admin Credentials." });
            return res.json({ token: "fake-jwt-admin", user: users[0] });
        } 
        
        if (role === 'supplier') {
            const [suppliers] = await db.query('SELECT id, name, approval_status FROM suppliers WHERE contact_email = ? AND password = ?', [email, password]);
            if (suppliers.length === 0) return res.status(401).json({ error: "Invalid Supplier Credentials." });
            
            const supplier = suppliers[0];
            if (supplier.approval_status === 'pending') return res.status(403).json({ error: "Your account is still pending Admin approval." });
            if (supplier.approval_status === 'rejected') return res.status(403).json({ error: "Your supplier account was rejected." });
            
            return res.json({ token: "fake-jwt-supplier", user: { id: supplier.id, name: supplier.name, role: 'supplier' } });
        }

        res.status(400).json({ error: "Invalid login type." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login process failed." });
    }
});

// -----------------------------------------
// Admin Workflows
// -----------------------------------------
app.get('/api/admin/pending-suppliers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, contact_email, contact_phone, created_at FROM suppliers WHERE approval_status = "pending"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending suppliers." });
    }
});

app.put('/api/admin/approve-supplier/:id', async (req, res) => {
    try {
        await db.query('UPDATE suppliers SET approval_status = "approved" WHERE id = ?', [req.params.id]);
        res.json({ message: "Supplier Approved Successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to approve supplier." });
    }
});

app.put('/api/admin/reject-supplier/:id', async (req, res) => {
    try {
        await db.query('UPDATE suppliers SET approval_status = "rejected" WHERE id = ?', [req.params.id]);
        res.json({ message: "Supplier Rejected" });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject supplier." });
    }
});

app.get('/api/suppliers/approved', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.id, s.name, s.contact_email, s.contact_phone, s.reliability_score, s.security_score, s.average_lead_time_days,
            (SELECT MIN(DATEDIFF(expiration_date, CURDATE())) FROM inventory WHERE supplier_id = s.id AND quantity_in_stock > 0) as min_expiration_days
            FROM suppliers s 
            WHERE s.approval_status = "approved"
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch approved suppliers." });
    }
});

// -----------------------------------------
// Supplier Workflows
// -----------------------------------------
// Allow a supplier to log an inventory batch (creates a supply order record)
app.post('/api/supplier/add-inventory', async (req, res) => {
    try {
        const { supplier_id, drug_name, quantity, batch_number, unit_price, lead_time_days, expiry_date } = req.body;
        
        // 1. Find or create the drug reference
        let [drugs] = await db.query('SELECT id FROM drugs WHERE name = ?', [drug_name]);
        let specific_drug_id;
        
        if (drugs.length === 0) {
            const [newDrug] = await db.query('INSERT INTO drugs (name, description) VALUES (?, ?)', [drug_name, "Added by supplier portal"]);
            specific_drug_id = newDrug.insertId;
        } else {
            specific_drug_id = drugs[0].id;
        }

        // 2. Insert into inventory (Stock available)
        await db.query(
            'INSERT INTO inventory (drug_id, supplier_id, quantity_in_stock, batch_number, expiration_date) VALUES (?, ?, ?, ?, ?)',
            [specific_drug_id, supplier_id, quantity, batch_number, expiry_date]
        );

        // 3. Create a corresponding 'pending' order for tracking (Admin must mark as delivered)
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + (parseInt(lead_time_days) || 3));

        await db.query(
            `INSERT INTO orders (drug_id, supplier_id, ordered_by, quantity, status, expected_delivery_date, unit_price) 
             VALUES (?, ?, 1, ?, 'pending', ?, ?)`,
            [specific_drug_id, supplier_id, quantity, expectedDate, unit_price || 0.0]
        );

        // 4. Trigger initial reliability update (in case it's their first shipment)
        updateSupplierReliability(supplier_id);

        res.status(201).json({ message: "Stock & Performance metrics successfully integrated into NexusMed intelligence!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to record inventory shipment." });
    }
});

// -----------------------------------------
// Legacy Drugs (Inventory) CRUD Routes
// -----------------------------------------
app.get('/api/drugs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*, COALESCE(SUM(i.quantity_in_stock), 0) as current_stock 
            FROM drugs d 
            LEFT JOIN inventory i ON d.id = i.drug_id 
            GROUP BY d.id 
            ORDER BY d.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch drugs." });
    }
});

app.post('/api/drugs', async (req, res) => {
    try {
        const { name, description, critical_threshold } = req.body;
        const [result] = await db.query(
            'INSERT INTO drugs (name, description, critical_threshold) VALUES (?, ?, ?)',
            [name, description, critical_threshold]
        );
        res.status(201).json({ id: result.insertId, name, description, critical_threshold });
    } catch (error) {
        res.status(500).json({ error: "Failed to insert drug into database." });
    }
});

app.put('/api/drugs/:id', async (req, res) => {
    try {
        await db.query('UPDATE drugs SET name = ?, description = ?, critical_threshold = ? WHERE id = ?', 
            [req.body.name, req.body.description, req.body.critical_threshold, req.params.id]);
        res.json({ message: "Updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update drug." });
    }
});

app.delete('/api/drugs/:id', async (req, res) => {
    try {
        const drugId = req.params.id;
        // 1. Delete associated inventory
        await db.query('DELETE FROM inventory WHERE drug_id = ?', [drugId]);
        // 2. Delete associated orders
        await db.query('DELETE FROM orders WHERE drug_id = ?', [drugId]);
        // 3. Delete the drug itself
        await db.query('DELETE FROM drugs WHERE id = ?', [drugId]);
        
        res.json({ message: "Asset and all associated records purged successfully." });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to purge asset record. Check foreign key constraints." });
    }
});

// -----------------------------------------
// AI Supplier Intelligence Routes
// -----------------------------------------

// Helper to update supplier reliability in DB
async function updateSupplierReliability(supplier_id) {
    try {
        const [orders] = await db.query(
            `SELECT 
                DATEDIFF(COALESCE(delivery_date, NOW()), COALESCE(expected_delivery_date, NOW())) as delay_days,
                COALESCE(quality_rating, 5) as quality_rating
             FROM orders 
             WHERE supplier_id = ? AND status = 'delivered' 
             ORDER BY delivery_date DESC LIMIT 10`,
            [supplier_id]
        );

        if (orders.length === 0) return;

        const lead_times = orders.map(o => Math.max(0, (o.delay_days || 0) + 3));
        const defects = orders.map(o => (o.quality_rating || 5) < 3 ? 1 : 0);

        try {
            const mlRes = await axios.post('http://localhost:8000/supplier-grading', {
                supplier_id,
                lead_times: lead_times.length > 0 ? lead_times : [3],
                defect_rates: defects.length > 0 ? defects : [0]
            });
            const newScore = mlRes.data.reliability_score;
            await db.query('UPDATE suppliers SET reliability_score = ? WHERE id = ?', [newScore, supplier_id]);
            console.log(`Updated Supplier ${supplier_id} reliability score to ${newScore}`);
        } catch (mlError) {
            // ML offline — compute heuristic score from order history
            const avgDelay = lead_times.reduce((a, b) => a + b, 0) / lead_times.length;
            const defectRate = defects.reduce((a, b) => a + b, 0) / defects.length;
            
            // Tiered Late Delivery Penalty (Points Deduction)
            let latePenalty = 0;
            if (avgDelay > 5) latePenalty = 40;
            else if (avgDelay > 2) latePenalty = 20;
            else if (avgDelay > 0) latePenalty = 10;

            let heuristicScore = Math.round(100 - latePenalty - (defectRate * 50));

            // Apply "Safety First" Freshness Penalty (Expiration-based ranking)
            const [expData] = await db.query(
                'SELECT MIN(DATEDIFF(expiration_date, CURDATE())) as days FROM inventory WHERE supplier_id = ? AND quantity_in_stock > 0',
                [supplier_id]
            );
            
            if (expData.length > 0 && expData[0].days !== null) {
                const daysToExpiry = expData[0].days;
                
                if (daysToExpiry < 0) {
                    // SAFETY FIRST: Critical Penalty for Expired Stock (formerly 0)
                    heuristicScore = Math.min(heuristicScore, 30);
                    console.warn(`Supplier ${supplier_id} CRITICAL PENALTY: Expired stock detected.`);
                } else if (daysToExpiry < 30) {
                    heuristicScore -= 30; // Critical
                } else if (daysToExpiry < 60) {
                    heuristicScore -= 15; // Warning
                } else if (daysToExpiry < 90) {
                    heuristicScore -= 5; // Caution
                }
            }

            heuristicScore = Math.max(0, heuristicScore);
            await db.query('UPDATE suppliers SET reliability_score = ? WHERE id = ?', [heuristicScore, supplier_id]);
            console.log(`ML offline. Final heuristic score for Supplier ${supplier_id} (including "Safety First"): ${heuristicScore}`);
        }
    } catch (error) {
        console.error("Failed to update reliability score:", error.message);
    }
}

// -----------------------------------------
// NexusMed Global Intelligence
// -----------------------------------------

// AI Health Monitor: Aggregates system signals into conversational alerts
app.get('/api/admin/system-health', async (req, res) => {
    try {
        const alerts = [];

        // 1. Check for stock shortages
        const [shortages] = await db.query(`
            SELECT d.id, d.name, COALESCE(SUM(i.quantity_in_stock), 0) as total, d.critical_threshold 
            FROM drugs d
            LEFT JOIN inventory i ON d.id = i.drug_id
            GROUP BY d.id
            HAVING total < d.critical_threshold OR total IS NULL
        `);
        shortages.forEach(s => {
            alerts.push({
                id: `stock-${s.name}`,
                type: 'critical',
                category: 'inventory',
                drug_id: s.id,
                drug_name: s.name,
                message: `${s.name} is below critical threshold (${s.total || 0}/${s.critical_threshold}). Automated reorder suggested.`,
                action: 'reorder'
            });
        });

        // 2. Check for impending expirations (within 60 days)
        const [expirations] = await db.query(`
            SELECT d.name, i.batch_number, i.expiration_date as expiry_date, s.name as supplier
            FROM inventory i
            JOIN drugs d ON i.drug_id = d.id
            JOIN suppliers s ON i.supplier_id = s.id
            WHERE i.expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 60 DAY)
        `);
        expirations.forEach(e => {
            const days = Math.round((new Date(e.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            alerts.push({
                id: `expiry-${e.batch_number}`,
                type: days < 15 ? 'critical' : 'warning',
                category: 'expiry',
                message: `Batch #${e.batch_number} (${e.name}) from ${e.supplier} expires in ${days} days. Action: Liquidate or prioritize usage.`,
                action: 'review'
            });
        });

        // 3. Supplier reliability alerts
        const [volatility] = await db.query(`SELECT name, reliability_score FROM suppliers WHERE reliability_score < 70 AND approval_status = 'approved'`);
        volatility.forEach(v => {
            alerts.push({
                id: `vendor-${v.name}`,
                type: 'warning',
                category: 'supplier',
                message: `Vendor ${v.name} is showing a downward reliability trend (${v.reliability_score}%). Consider diversifying source.`,
                action: 'analyze'
            });
        });

        // 4. REAL Stock Breakdown (per supplier) for Dashboard modals
        const [stockBreakdown] = await db.query(`
            SELECT s.name as supplier, SUM(i.quantity_in_stock) as units
            FROM inventory i
            JOIN suppliers s ON i.supplier_id = s.id
            WHERE s.approval_status = 'approved'
            GROUP BY s.id
            ORDER BY units DESC
        `);

        // 5. REAL Shortage Details (current stock vs threshold)
        const [shortageDetails] = await db.query(`
            SELECT d.name as drug, COALESCE(SUM(i.quantity_in_stock), 0) as current_stock, d.critical_threshold as threshold
            FROM drugs d
            LEFT JOIN inventory i ON d.id = i.drug_id
            GROUP BY d.id
            HAVING current_stock < d.critical_threshold OR current_stock IS NULL
        `);

        // 6. REAL Supplier Specs (supplier → drugs mapping)
        const [supplierDrugs] = await db.query(`
            SELECT s.id, s.name, s.contact_email, GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR '|') as drugs
            FROM suppliers s
            JOIN inventory i ON s.id = i.supplier_id
            JOIN drugs d ON i.drug_id = d.id
            WHERE s.approval_status = 'approved'
            GROUP BY s.id
        `);
        const supplierSpecs = supplierDrugs.map(s => ({
            name: s.name,
            contact: s.contact_email,
            drugs: s.drugs ? s.drugs.split('|') : []
        }));

        // Compute total stock for header
        const totalStock = stockBreakdown.reduce((sum, s) => sum + (parseInt(s.units) || 0), 0);

        // Compute percentage for each supplier
        const enrichedBreakdown = stockBreakdown.map(s => ({
            supplier: s.supplier,
            units: parseInt(s.units) || 0,
            percentage: totalStock > 0 ? Math.round((parseInt(s.units) / totalStock) * 100) : 0
        }));

        res.json({
            status: 'operational',
            system_score: Math.max(50, 100 - (alerts.length * 5)),
            total_stock_units: totalStock,
            alerts: alerts.length > 0 ? alerts : [{ id: 'health-ok', type: 'success', category: 'general', message: 'System vitals confirmed. All stock and logistics within safety bounds.' }],
            stock_breakdown: enrichedBreakdown,
            shortage_details: shortageDetails,
            supplier_specs: supplierSpecs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Health monitor diagnostics failed." });
    }
});

// Cybersecurity Ecosystem Benchmarking (Aggregated from CSV/Excel)
app.get('/api/admin/security-benchmarks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT AVG(security_score) as avg_score FROM suppliers WHERE approval_status = "approved"');
        const currentAvg = rows[0].avg_score || 0;

        // Static benchmarks derived from the IoT Security Survey Dataset (Industry averages)
        const industryBenchmarks = [
            { category: 'Compliance', value: 72 },
            { category: 'Training', value: 58 },
            { category: 'Awareness', value: 64 },
            { category: 'Policies', value: 69 }
        ];

        res.json({
            current_avg: Math.round(currentAvg),
            industry_avg: 65, // Derived from dataset analysis
            benchmarks: industryBenchmarks
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch security benchmarks." });
    }
});

// Smart Recommendation Engine
app.post('/api/recommend-supplier', async (req, res) => {
    try {
        const { drug_id, priority } = req.body;

        // 1. Get all approved suppliers with their stock and last price for this drug
        const [suppliers] = await db.query(
            `SELECT s.id, s.name, COALESCE(s.reliability_score, 75) as score,
                    COALESCE(s.security_score, 0) as security_score,
                    COALESCE(MAX(i.quantity_in_stock), 0) as stock, 
                    (SELECT unit_price FROM orders WHERE drug_id = ? AND supplier_id = s.id AND unit_price > 0 ORDER BY order_date DESC LIMIT 1) as last_price
             FROM suppliers s
             LEFT JOIN inventory i ON s.id = i.supplier_id AND i.drug_id = ?
             WHERE s.approval_status = 'approved'
             GROUP BY s.id`,
            [drug_id, drug_id]
        );

        if (suppliers.length === 0) {
            return res.json({ 
                priority: priority || 'reliability', 
                top_recommendations: [], 
                error: "No active vendors found. Approve suppliers via the Governance tab first." 
            });
        }

        // 2. Format data for ML Engine
        const mlSuppliers = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            price: parseFloat(s.last_price) || parseFloat((Math.random() * 15 + 5).toFixed(2)), 
            lead_time: Math.floor(Math.random() * 5) + 1, 
            score: parseFloat(s.score) || 75,
            security_score: parseFloat(s.security_score) || 0
        }));

        // 3. Try Machine Learning Engine first
        try {
            const mlRes = await axios.post('http://localhost:8000/smart-recommendation', {
                priority: priority || 'reliability',
                suppliers: mlSuppliers
            });
            return res.json(mlRes.data);
        } catch (mlError) {
            // 4. ML offline fallback — score suppliers heuristically and return top 3
            console.warn("ML service offline, using heuristic scoring.");
            const scored = mlSuppliers.map(s => {
                let ai_score;
                if (priority === 'cost') {
                    const minPrice = Math.min(...mlSuppliers.map(x => x.price));
                    ai_score = Math.round(100 - ((s.price - minPrice) / (minPrice + 1)) * 40 + (s.score * 0.3));
                } else if (priority === 'urgency') {
                    const minLead = Math.min(...mlSuppliers.map(x => x.lead_time));
                    ai_score = Math.round(100 - ((s.lead_time - minLead) * 10) + (s.score * 0.3));
                } else if (priority === 'security') {
                    ai_score = Math.round(s.security_score * 0.7 + s.score * 0.3);
                } else {
                    ai_score = Math.round(s.score * 0.7 + (100 - s.lead_time * 5) * 0.2 + (100 - s.price * 2) * 0.1);
                }
                ai_score = Math.max(10, Math.min(100, ai_score));
                const risk_level = s.score >= 80 ? 'Low' : s.score >= 60 ? 'Medium' : 'High';
                return {
                    ...s,
                    ai_score,
                    risk_level,
                    reason: `Selected for ${priority} focus. Reliability: ${s.score}%, Price: $${s.price.toFixed(2)}/unit, Lead: ${s.lead_time} days.`
                };
            }).sort((a, b) => b.ai_score - a.ai_score).slice(0, 3);

            return res.json({
                priority: priority || 'reliability',
                top_recommendations: scored,
                source: 'heuristic_fallback'
            });
        }
    } catch (error) {
        console.error("Recommendation Engine Error:", error.message);
        res.status(500).json({ error: "Recommendation engine failed. Ensure MySQL is running." });
    }
});

// Analytics: Supplier Performance Trends
app.get('/api/analytics/supplier-trends', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.name as supplier,
                DATE_FORMAT(o.order_date, '%b') as month,
                COALESCE(AVG(DATEDIFF(COALESCE(o.delivery_date, NOW()), COALESCE(o.expected_delivery_date, o.order_date))), 0) as avg_delay,
                COALESCE(AVG(o.unit_price), 0) as avg_price,
                COALESCE(AVG(o.quality_rating), 5) as avg_quality
            FROM orders o
            JOIN suppliers s ON o.supplier_id = s.id
            WHERE o.order_date IS NOT NULL
            GROUP BY s.id, month
            ORDER BY MAX(o.order_date) ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Trends error:", error.message);
        res.status(500).json({ error: "Failed to fetch analytics." });
    }
});

// Analytics: Supplier Metrics (Cost, Urgency, Reliability, Security)
app.get('/api/analytics/supplier-metrics', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.id,
                s.name as supplier,
                s.reliability_score as reliability,
                s.security_score as security,
                COALESCE((SELECT AVG(unit_price) FROM orders WHERE supplier_id = s.id AND unit_price > 0), 0) as cost,
                COALESCE((SELECT AVG(DATEDIFF(COALESCE(delivery_date, NOW()), order_date)) FROM orders WHERE supplier_id = s.id), 0) as urgency
            FROM suppliers s
            WHERE s.approval_status = 'approved'
        `);
        res.json(rows);
    } catch (error) {
        console.error("Metrics error:", error.message);
        res.status(500).json({ error: "Failed to fetch metrics." });
    }
});

// Analytics: Pharmaceutical Expiration Horizon
app.get('/api/analytics/expiration-horizon', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                SUM(CASE WHEN DATEDIFF(expiration_date, CURDATE()) <= 30 THEN quantity_in_stock ELSE 0 END) as bucket_30,
                SUM(CASE WHEN DATEDIFF(expiration_date, CURDATE()) > 30 AND DATEDIFF(expiration_date, CURDATE()) <= 60 THEN quantity_in_stock ELSE 0 END) as bucket_60,
                SUM(CASE WHEN DATEDIFF(expiration_date, CURDATE()) > 60 AND DATEDIFF(expiration_date, CURDATE()) <= 90 THEN quantity_in_stock ELSE 0 END) as bucket_90,
                SUM(CASE WHEN DATEDIFF(expiration_date, CURDATE()) > 90 THEN quantity_in_stock ELSE 0 END) as bucket_120plus,
                SUM(quantity_in_stock) as total_stock
            FROM inventory
        `);

        const stats = rows[0];
        const exposureRisk = stats.total_stock > 0 
            ? ((stats.bucket_30 / stats.total_stock) * 100).toFixed(1)
            : 0;

        // Identify "worst hit" drug (most units expiring within 30 days)
        const [worstHit] = await db.query(`
            SELECT d.name, SUM(i.quantity_in_stock) as expiring_soon
            FROM inventory i
            JOIN drugs d ON i.drug_id = d.id
            WHERE DATEDIFF(i.expiration_date, CURDATE()) <= 30
            GROUP BY d.id
            ORDER BY expiring_soon DESC
            LIMIT 1
        `);

        res.json({
            horizon: [
                { name: '30 Days', stock: parseInt(stats.bucket_30) || 0, risk: stats.total_stock > 0 ? Math.round((stats.bucket_30 / stats.total_stock) * 100) : 0 },
                { name: '60 Days', stock: parseInt(stats.bucket_60) || 0, risk: stats.total_stock > 0 ? Math.round((stats.bucket_60 / stats.total_stock) * 100 * 0.5) : 0 },
                { name: '90 Days', stock: parseInt(stats.bucket_90) || 0, risk: stats.total_stock > 0 ? Math.round((stats.bucket_90 / stats.total_stock) * 100 * 0.2) : 0 },
                { name: '120+ Days', stock: parseInt(stats.bucket_120plus) || 0, risk: stats.total_stock > 0 ? Math.round((stats.bucket_120plus / stats.total_stock) * 100 * 0.05) : 0 },
            ],
            exposure_risk: exposureRisk,
            top_risk_medication: worstHit.length > 0 ? worstHit[0].name : null,
            total_stock: stats.total_stock || 0
        });
    } catch (error) {
        console.error("Expiration analytics error:", error.message);
        res.status(500).json({ error: "Failed to fetch expiration analytics." });
    }
});

// Real-Time Neural Diagnostics Engine
app.get('/api/admin/run-diagnostics', async (req, res) => {
    try {
        const anomalies = [];
        let systemScore = 100;

        // 0. Check for Data Presence (Cold Start Check)
        const [drugCount] = await db.query('SELECT COUNT(*) as count FROM drugs');
        const hasData = drugCount[0].count > 0;

        if (!hasData) {
            return res.json({
                status: "standby",
                system_score: 0,
                interpretation: "Neural core is in standby mode. No pharmaceutical assets detected in the lattice. Data ingestion required to initiate active monitoring.",
                anomalies: [
                    { severity: "info", message: "SYSTEM IDLE: Awaiting drug repository initialization. Asset Repository node is currently empty." }
                ]
            });
        }

        // 1. Check for Critical Stock Shortages
        const [shortages] = await db.query(`
            SELECT d.name, COALESCE(SUM(i.quantity_in_stock), 0) as stock, d.critical_threshold
            FROM drugs d
            LEFT JOIN inventory i ON d.id = i.drug_id
            GROUP BY d.id
            HAVING stock < d.critical_threshold
        `);
        shortages.forEach(s => {
            anomalies.push({
                severity: "critical",
                message: `${s.name} stock level (${s.stock}) is significantly below the safety threshold of ${s.critical_threshold}. Immediate replenishment required.`
            });
            systemScore -= 10;
        });

        // 2. Check for Expiring Batches (within 30 days)
        const [expiring] = await db.query(`
            SELECT d.name, i.batch_number, i.quantity_in_stock
            FROM inventory i
            JOIN drugs d ON i.drug_id = d.id
            WHERE DATEDIFF(i.expiration_date, CURDATE()) <= 30 AND i.quantity_in_stock > 0
        `);
        expiring.forEach(e => {
            anomalies.push({
                severity: "warning",
                message: `Batch ${e.batch_number} of ${e.name} (${e.quantity_in_stock} units) is expiring within 30 days. Liquidate or redistribute immediately.`
            });
            systemScore -= 5;
        });

        // 3. Check for Unreliable Suppliers
        const [unreliable] = await db.query(`
            SELECT name, reliability_score 
            FROM suppliers 
            WHERE reliability_score < 60 AND approval_status = 'approved'
        `);
        unreliable.forEach(u => {
            anomalies.push({
                severity: "warning",
                message: `Vendor '${u.name}' reliability grade has dropped to ${u.reliability_score}%. Procurement risk for this node is increasing.`
            });
            systemScore -= 7;
        });

        // Final score capping
        systemScore = Math.max(0, systemScore);

        res.json({
            status: "success",
            system_score: systemScore,
            interpretation: systemScore === 100 
                ? "Neural nodes report 100% stability. No anomalies detected across the pharmaceutical lattice."
                : systemScore > 70 
                ? "System health remains optimal. All identified flags are within corrective capacity."
                : "Neural core detects multiple lattice breaches. Diversify procurement routes immediately.",
            anomalies: anomalies.length > 0 ? anomalies : [
                { severity: "info", message: "NexusMed Neural Core analysis complete. No structural anomalies detected in current dataset." }
            ]
        });
    } catch (error) {
        console.error("Diagnostics Error:", error);
        res.status(500).json({ error: "Neural diagnostic link failure." });
    }
});

// Admin Review: Detailed Shipment Logs from Suppliers
app.get('/api/admin/shipment-logs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                o.id,
                d.name as drug_name,
                s.name as supplier_name,
                o.quantity,
                o.unit_price,
                (o.quantity * o.unit_price) as total_price,
                o.expected_delivery_date,
                o.delivery_date,
                o.order_date,
                o.status
            FROM orders o
            JOIN drugs d ON o.drug_id = d.id
            JOIN suppliers s ON o.supplier_id = s.id
            ORDER BY o.order_date DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch shipment logs." });
    }
});

// Update order status and trigger reliability update
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status, delivery_date, quality_rating } = req.body;
        const q = status === 'delivered' 
            ? 'UPDATE orders SET status = ?, delivery_date = ?, quality_rating = ? WHERE id = ?'
            : 'UPDATE orders SET status = ? WHERE id = ?';
        
        const params = status === 'delivered' 
            ? [status, delivery_date || new Date(), quality_rating || 5, req.params.id]
            : [status, req.params.id];

        await db.query(q, params);

        if (status === 'delivered') {
            // Find the order details to update inventory
            const [orderRows] = await db.query('SELECT drug_id, supplier_id, quantity FROM orders WHERE id = ?', [req.params.id]);
            if (orderRows.length > 0) {
                const o = orderRows[0];
                // Update Reliability Score
                updateSupplierReliability(o.supplier_id);
                // Note: Inventory was already inserted in 'add-inventory' by the supplier portal.
                // In a production app, we would only insert it here after verification.
            }
        }

        res.json({ message: "Order status updated." });
    } catch (error) {
        res.status(500).json({ error: "Failed to update order." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
