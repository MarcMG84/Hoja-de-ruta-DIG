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

async function checkMaxDate() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const result = await pool.request().query("SELECT MAX(fec_pjt) as max_date, MIN(fec_pjt) as min_date FROM vision.seguimiento_tramos");
        console.log('--- DATE RANGE (seguimiento_tramos) ---');
        console.log(result.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkMaxDate();
