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

async function listDbo() {
    try {
        let pool = await sql.connect(dbConfig);
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'");
        console.log('Tables in dbo schema:');
        console.log(res.recordset.map(r => r.TABLE_NAME).join('\n'));
        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

listDbo();
