const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables manually
const envPath = path.join(__dirname, '.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

// 2. Connect to Database
const client = new Client({
    host: envConfig.DB_HOST || 'localhost',
    port: parseInt(envConfig.DB_PORT) || 5432,
    user: envConfig.DB_USERNAME || 'postgres',
    password: envConfig.DB_PASSWORD || 'postgres',
    database: envConfig.DB_NAME || 'cablevalidator',
});

async function viewData() {
    try {
        await client.connect();
        console.log('✅ Connected to Database');

        // 3. Query Tables
        console.log('\n--- 📋 DESIGNS ---');
        const designs = await client.query('SELECT * FROM design');
        if (designs.rows.length > 0) {
            console.table(designs.rows);
        } else {
            console.log('No designs found.');
        }

        console.log('\n--- 🏭 CABLE PROCESSES ---');
        const processes = await client.query('SELECT * FROM cable_process');
        if (processes.rows.length > 0) {
            console.table(processes.rows.map(r => ({ id: r.id, name: r.name, design_id: r.designId })));
        } else {
            console.log('No processes found.');
        }

        console.log('\n--- ⚙️ SPECIFICATIONS ---');
        const specs = await client.query('SELECT * FROM process_specification');
        if (specs.rows.length > 0) {
            console.table(specs.rows.map(r => ({ id: r.id, key: r.key, value: r.value, process_id: r.processId })));
        } else {
            console.log('No specifications found.');
        }

        console.log('\n--- 📏 IEC CONDUCTORS (Sample) ---');
        const conductors = await client.query('SELECT * FROM iec_conductor LIMIT 5');
        console.table(conductors.rows);

    } catch (err) {
        console.error('❌ Error querying database:', err.message);
    } finally {
        await client.end();
    }
}

viewData();
