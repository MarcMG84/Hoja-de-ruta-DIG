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

async function find432415() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        console.log('--- SEARCHING 432415 as NVARCHAR ---');

        const resGP = await pool.request()
            .input('id', sql.NVarChar, '432415')
            .query("SELECT * FROM vision.estado_gps WHERE num_hoja = @id");
        console.log('estado_gps:', resGP.recordset);

        const resSEG = await pool.request()
            .input('id', sql.NVarChar, '432415')
            .query("SELECT * FROM vision.seguimiento_tramos WHERE code = @id");
        console.log('seguimiento_tramos:', resSEG.recordset);

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

find432415();
