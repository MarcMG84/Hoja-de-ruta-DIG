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

async function checkDateRanges() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const gp = await pool.request().query("SELECT MIN(fecha_hoja_ruta) as min_date, MAX(fecha_hoja_ruta) as max_date FROM vision.estado_gps");
        console.log('--- DATE RANGE (estado_gps) ---');
        console.log(gp.recordset);

        // Explicitly search for ANY record with year 2025
        const count2025 = await pool.request().query("SELECT COUNT(*) as total FROM vision.estado_gps WHERE YEAR(fecha_hoja_ruta) = 2025");
        console.log('Records from 2025 in estado_gps:', count2025.recordset[0].total);

        const count2026 = await pool.request().query("SELECT COUNT(*) as total FROM vision.estado_gps WHERE YEAR(fecha_hoja_ruta) = 2026");
        console.log('Records from 2026 in estado_gps:', count2026.recordset[0].total);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkDateRanges();
