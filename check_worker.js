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

async function checkWorker70333() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const res = await pool.request().query("SELECT num_hoja, titular, fecha_hoja_ruta FROM vision.estado_gps WHERE titular LIKE '%70333%'");
        console.log('Routes for 70333:');
        console.log(res.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkWorker70333();
