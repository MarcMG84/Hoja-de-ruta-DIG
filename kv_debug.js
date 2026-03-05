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
        const result = await pool.request().query("SELECT TOP 1 * FROM vision.estado_gps WHERE num_hoja = '436609'");

        if (result.recordset.length > 0) {
            console.log('--- KEYS AND VALUES for 436609 ---');
            const row = result.recordset[0];
            for (let key in row) {
                console.log(`${key}: ${row[key]}`);
            }
        } else {
            console.log('Route 436609 not found in estado_gps');
        }
        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRoute();
