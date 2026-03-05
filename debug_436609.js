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

async function checkRoute() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('Checking state_gps...');
        let result = await pool.request().query(`
            SELECT TOP 1 *
            FROM vision.estado_gps 
            WHERE num_hoja = '436609'
        `);

        if (result.recordset.length === 0) {
            console.log('Checking seguimiento_tramos...');
            result = await pool.request().query(`
                SELECT TOP 1 *
                FROM vision.seguimiento_tramos 
                WHERE code = '436609'
            `);
        }

        if (result.recordset.length > 0) {
            console.log('--- RAW DATA (436609) ---');
            console.log(JSON.stringify(result.recordset[0], null, 2));
        } else {
            console.log('Route 436609 not found');
        }
        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRoute();
