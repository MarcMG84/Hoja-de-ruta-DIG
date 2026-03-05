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

async function deepSearch() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        console.log('--- DEEP SEARCH FOR 72510 ---');

        // Search in estado_gps
        const gp = await pool.request().query("SELECT num_hoja, titular FROM vision.estado_gps WHERE titular LIKE '%72510%' OR num_hoja LIKE '%72510%'");
        console.log('estado_gps matches:', gp.recordset);

        // Search in seguimiento_tramos
        const seg = await pool.request().query("SELECT TOP 5 num_hoja, titular, fec_pjt FROM vision.seguimiento_tramos WHERE titular LIKE '%72510%' OR num_hoja LIKE '%72510%'");
        console.log('seguimiento_tramos matches:', seg.recordset);

        // Search in a generic way if possible
        const tables = ['vision.responsable', 'vision.srm_responsable', 'dbo.registros_actividad'];
        for (const table of tables) {
            try {
                const res = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
                const cols = Object.keys(res.recordset[0] || {});
                if (cols.length > 0) {
                    const where = cols.map(c => `CAST([${c}] AS NVARCHAR(MAX)) LIKE '%72510%'`).join(' OR ');
                    const search = await pool.request().query(`SELECT TOP 5 * FROM ${table} WHERE ${where}`);
                    if (search.recordset.length > 0) {
                        console.log(`Matches in ${table}:`, search.recordset);
                    }
                }
            } catch (e) { }
        }

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

deepSearch();
