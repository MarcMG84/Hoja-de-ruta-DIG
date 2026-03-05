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

async function check() {
    try {
        await sql.connect(dbConfig);
        console.log('--- SEARCHING 436624 ---');

        // 1. estado_gps
        const q1 = await sql.query("SELECT num_hoja, vehiculo, flota, titular FROM vision.estado_gps WHERE num_hoja = 436624");
        console.log('estado_gps:', q1.recordset);

        // 2. seguimiento_tramos
        const q2 = await sql.query("SELECT code, cal_cal, mat_hor, titular FROM vision.seguimiento_tramos WHERE code = '436624'");
        console.log('seguimiento_tramos:', q2.recordset);

        // 3. Try to find vehicle in ANY table that has the code
        const q3 = await sql.query("SELECT TOP 1 * FROM vision.seguimiento_tramos WHERE code = '436624' AND (cal_cal IS NOT NULL OR mat_hor IS NOT NULL)");
        console.log('Any record in seguimiento with vehicle:', q3.recordset.length);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await sql.close();
    }
}
check();
