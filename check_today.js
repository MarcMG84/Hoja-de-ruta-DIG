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

async function checkToday() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        // 1. All routes for today in estado_gps
        const todayGP = await pool.request()
            .query("SELECT num_hoja, fecha_hoja_ruta, titular FROM vision.estado_gps WHERE CAST(fecha_hoja_ruta AS DATE) = '2025-02-24'");
        console.log('--- ROUTES FOR TODAY (estado_gps) ---');
        console.log(todayGP.recordset);

        // 2. Are there any search matches for 72510 at all?
        const any72510 = await pool.request()
            .query("SELECT * FROM vision.estado_gps WHERE num_hoja LIKE '%72510%' OR num_hoja = 72510");
        console.log('--- ANY MATCH FOR 72510? ---');
        console.log(any72510.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkToday();
