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

async function checkCounts() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        const tables = [
            'vision.estado_gps',
            'vision.hr_control_salida',
            'vision.seguimiento_tramos',
            'vision.tramos_no_realizado'
        ];

        for (const table of tables) {
            try {
                const result = await pool.request().query(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`${table}: ${result.recordset[0].total} records`);
            } catch (e) {
                console.log(`${table}: Error - ${e.message}`);
            }
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkCounts();
