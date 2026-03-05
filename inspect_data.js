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

async function inspectData() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        console.log('--- SAMPLE FROM estado_gps ---');
        const gp = await pool.request().query("SELECT TOP 1 * FROM vision.estado_gps");
        console.log(JSON.stringify(gp.recordset[0], null, 2));

        console.log('--- SAMPLE FROM seguimiento_tramos ---');
        const seg = await pool.request().query("SELECT TOP 1 * FROM vision.seguimiento_tramos");
        console.log(JSON.stringify(seg.recordset[0], null, 2));

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

inspectData();
