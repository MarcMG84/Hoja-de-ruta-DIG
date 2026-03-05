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
        console.log('--- SEARCHING RECORDS FOR WORKER 64407 ON 2026-02-25 ---');

        const q1 = await sql.query("SELECT TOP 1 * FROM vision.estado_gps WHERE titular LIKE '%64407%' AND vehiculo IS NOT NULL AND vehiculo <> '' AND vehiculo <> ' - ' ORDER BY fecha_hoja_ruta DESC");
        console.log('Most recent historical assignment for worker:', q1.recordset);

        // Check seguimiento_tramos
        const q2 = await sql.query("SELECT * FROM vision.seguimiento_tramos WHERE titular LIKE '%64407%' AND CAST(fec_hor AS DATE) = '2026-02-25'");
        console.log('seguimiento_tramos results:', q2.recordset.length);
        if (q2.recordset.length > 0) {
            console.log('Vehicles in seguimiento_tramos:', q2.recordset.map(r => ({ code: r.code, v: r.cal_cal, f: r.mat_hor })));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
check();
