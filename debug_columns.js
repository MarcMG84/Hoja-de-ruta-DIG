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

async function checkColumns() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected');

        console.log('\n--- vision.estado_gps ---');
        const res1 = await pool.request().query("SELECT TOP 1 * FROM vision.estado_gps");
        if (res1.recordset.length > 0) {
            console.log('Columns:', Object.keys(res1.recordset[0]).join(', '));
        } else {
            console.log('Table is empty');
        }

        console.log('\n--- vision.seguimiento_tramos ---');
        const res2 = await pool.request().query("SELECT TOP 1 * FROM vision.seguimiento_tramos");
        if (res2.recordset.length > 0) {
            console.log('Columns:', Object.keys(res2.recordset[0]).join(', '));
        } else {
            console.log('Table is empty');
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkColumns();
