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
        console.log('--- SEARCHING RECORDS FOR EQUIP RSL_R_02 ON 2026-02-25 ---');

        const q1 = await sql.query("SELECT TOP 1 * FROM vision.estado_gps WHERE ruta = 'RSL_R_02' AND vehiculo IS NOT NULL AND vehiculo <> '' AND vehiculo <> ' - ' ORDER BY fecha_hoja_ruta DESC");
        console.log('Most recent historical assignment:', q1.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
check();
