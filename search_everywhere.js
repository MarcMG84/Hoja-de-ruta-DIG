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

async function searchAll() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        console.log('--- SEARCHING FOR 72510 IN ALL TABLES ---');

        const tables = [
            'vision.estado_gps',
            'vision.seguimiento_tramos',
            'vision.hr_control_salida'
        ];

        for (const table of tables) {
            try {
                const result = await pool.request().query(`SELECT TOP 1 * FROM ${table} WHERE num_hoja = '72510'`);
                if (result.recordset.length > 0) {
                    console.log(`Found in ${table}:`, result.recordset[0]);
                } else {
                    console.log(`Not found in ${table}`);
                }
            } catch (e) {
                console.log(`Error searching in ${table}: ${e.message}`);
            }
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

searchAll();
