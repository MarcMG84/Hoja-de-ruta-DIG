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

async function checkDetails() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        // 1. Check sample data from hr_control_salida
        const sampleHR = await pool.request().query("SELECT TOP 5 * FROM vision.hr_control_salida");
        console.log('--- SAMPLE hr_control_salida ---');
        console.log(sampleHR.recordset);

        // 2. Check date range
        const range = await pool.request().query("SELECT MIN(f_salida) as min_date, MAX(f_salida) as max_date FROM vision.hr_control_salida");
        console.log('--- DATE RANGE hr_control_salida ---');
        console.log(range.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkDetails();
