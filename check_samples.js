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

async function checkSampleDates() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const result = await pool.request().query("SELECT TOP 5 num_hoja, fecha_hoja_ruta FROM vision.estado_gps");
        console.log('--- SAMPLE DATES ---');
        console.log(result.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkSampleDates();
