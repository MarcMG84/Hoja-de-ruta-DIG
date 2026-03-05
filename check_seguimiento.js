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

async function checkSeguimiento() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const schema = await pool.request().query("SELECT TOP 1 * FROM vision.seguimiento_tramos");
        console.log('--- seguimiento_tramos COLUMNS ---');
        console.log(Object.keys(schema.recordset[0] || {}));

        const sample = await pool.request().query("SELECT TOP 5 * FROM vision.seguimiento_tramos");
        console.log('--- SAMPLE seguimiento_tramos ---');
        console.log(sample.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkSeguimiento();
