const sql = require('mssql');
const fs = require('fs');
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

async function checkDateRange() {
    try {
        let pool = await sql.connect(dbConfig);
        let results = '✅ DB Date Range Analysis\n\n';

        const rangeGPS = await pool.request().query("SELECT MIN(fecha_hoja_ruta) as minDate, MAX(fecha_hoja_ruta) as maxDate, COUNT(*) as total FROM vision.estado_gps");
        results += '--- vision.estado_gps ---\n';
        results += `Total records: ${rangeGPS.recordset[0].total}\n`;
        results += `Min Date: ${rangeGPS.recordset[0].minDate}\n`;
        results += `Max Date: ${rangeGPS.recordset[0].maxDate}\n\n`;

        const rangeTramos = await pool.request().query("SELECT MIN(fec_hor) as minDate, MAX(fec_hor) as maxDate, COUNT(*) as total FROM vision.seguimiento_tramos");
        results += '--- vision.seguimiento_tramos ---\n';
        results += `Total records: ${rangeTramos.recordset[0].total}\n`;
        results += `Min Date: ${rangeTramos.recordset[0].minDate}\n`;
        results += `Max Date: ${rangeTramos.recordset[0].maxDate}\n`;

        fs.writeFileSync('db_date_results.txt', results);
        console.log('Results written to db_date_results.txt');
        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkDateRange();
