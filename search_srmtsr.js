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

async function searchSrmtsr() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const res = await pool.request().query("SELECT TOP 1 * FROM dbo.srmtsr");
        const cols = Object.keys(res.recordset[0] || {});
        if (cols.length > 0) {
            const where = cols.map(c => `CAST([${c}] AS NVARCHAR(MAX)) LIKE '%72510%'`).join(' OR ');
            const search = await pool.request().query(`SELECT TOP 5 * FROM dbo.srmtsr WHERE ${where}`);
            console.log(`Matches in dbo.srmtsr:`, search.recordset);
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

searchSrmtsr();
