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
        const result = await pool.request().query(`
            SELECT TOP 1 *
            FROM vision.seguimiento_tramos 
            WHERE code = '436186'
        `);

        if (result.recordset.length > 0) {
            console.log('--- RAW DATA (436186) ---');
            console.log(JSON.stringify(result.recordset[0], null, 2));
        } else {
            console.log('Route 436186 not found in estado_gps');
        }
        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRoute();
