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

async function findEverywhere() {
    try {
        await sql.connect(dbConfig);
        console.log('--- SCANNING ALL RELEVANT TABLES FOR 436624 ---');

        const tables = [
            'vision.estado_gps',
            'vision.seguimiento_tramos',
            'vision.hr_control_salida',
            'vision.registro_partes'
        ];

        for (const table of tables) {
            try {
                // Try searching in columns that usually have codes
                const columnsRes = await sql.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${table.split('.')[0]}' AND TABLE_NAME = '${table.split('.')[1]}'`);
                const cols = columnsRes.recordset.map(c => c.COLUMN_NAME);

                const searchCols = cols.filter(c => c.toLowerCase().includes('hoja') || c.toLowerCase().includes('code') || c.toLowerCase().includes('full') || c.toLowerCase().includes('f_'));

                if (searchCols.length > 0) {
                    const where = searchCols.map(c => `CAST(${c} AS VARCHAR) = '436624'`).join(' OR ');
                    const q = await sql.query(`SELECT TOP 1 * FROM ${table} WHERE ${where}`);
                    if (q.recordset.length > 0) {
                        console.log(`FOUND in ${table}:`, q.recordset[0]);
                    } else {
                        console.log(`NOT in ${table}`);
                    }
                }
            } catch (e) {
                console.log(`Error scanning ${table}:`, e.message);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
findEverywhere();
