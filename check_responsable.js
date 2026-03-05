const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000
    }
};

async function checkResponsable() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const res = await pool.request().query("SELECT TOP 10 * FROM vision.responsable");
        console.log('--- SAMPLE vision.responsable ---');
        console.log(res.recordset);

        // Check specifically for 72510
        const search = await pool.request().query("SELECT * FROM vision.responsable WHERE CAST(cod_responsable AS NVARCHAR(MAX)) LIKE '%72510%' OR CAST(num_tarjeta AS NVARCHAR(MAX)) LIKE '%72510%'");
        console.log('--- RECH PARA 72510 ---');
        console.log(search.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkResponsable();
