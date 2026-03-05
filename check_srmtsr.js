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

async function checkSrmtsr() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const schema = await pool.request().query("SELECT TOP 1 * FROM dbo.srmtsr");
        console.log('--- srmtsr COLUMNS ---');
        console.log(Object.keys(schema.recordset[0] || {}));

        const count = await pool.request().query("SELECT COUNT(*) as total FROM dbo.srmtsr");
        console.log('Total records in dbo.srmtsr:', count.recordset[0].total);

        const sample = await pool.request().query("SELECT TOP 5 * FROM dbo.srmtsr");
        console.log('--- SAMPLE srmtsr ---');
        console.log(sample.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkSrmtsr();
