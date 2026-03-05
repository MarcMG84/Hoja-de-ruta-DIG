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

async function findService() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        console.log('--- SEARCHING FOR "MOVIMENT DE CAIXES" ---');

        const resGP = await pool.request().query("SELECT TOP 5 num_hoja, servicio FROM vision.estado_gps WHERE servicio LIKE '%MOVIMENT DE CAIXES%'");
        console.log('estado_gps matches:', resGP.recordset);

        const resSEG = await pool.request().query("SELECT TOP 5 code, ser FROM vision.seguimiento_tramos WHERE ser LIKE '%MOVIMENT DE CAIXES%'");
        console.log('seguimiento_tramos matches:', resSEG.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

findService();
