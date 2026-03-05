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

async function inspectGP() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'vision' AND TABLE_NAME = 'estado_gps'
        `);

        console.log('--- EXACT COLUMNS (estado_gps) ---');
        result.recordset.forEach(c => console.log(`'${c.COLUMN_NAME}'`));

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

inspectGP();
