const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function inspectGP() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        // Find 432415 specifically
        const res = await pool.request().query("SELECT * FROM vision.estado_gps WHERE num_hoja = 432415 OR num_hoja LIKE '%432415%'");
        if (res.recordset.length > 0) {
            console.log('Full Record for 432415:');
            console.log(JSON.stringify(res.recordset[0], null, 2));
        } else {
            console.log('Record 432415 not found with exact match, showing 1 sample instead:');
            const sample = await pool.request().query("SELECT TOP 1 * FROM vision.estado_gps");
            console.log(JSON.stringify(sample.recordset[0], null, 2));
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

inspectGP();
