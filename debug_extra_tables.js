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

async function checkMoreTables() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected');

        const fs = require('fs');
        let results = '--- Extra Tables Columns ---\n\n';

        // Check srmtsr columns
        const srmCol = await pool.request().query("SELECT TOP 1 * FROM vision.srmtsr");
        results += '--- vision.srmtsr ---\n';
        if (srmCol.recordset.length > 0) {
            results += Object.keys(srmCol.recordset[0]).join('\n') + '\n\n';
        }

        // Check hr_control_salida columns
        const hrCol = await pool.request().query("SELECT TOP 1 * FROM vision.hr_control_salida");
        results += '--- vision.hr_control_salida ---\n';
        if (hrCol.recordset.length > 0) {
            results += Object.keys(hrCol.recordset[0]).join('\n') + '\n';
        }

        fs.writeFileSync('extra_tables_columns.txt', results);
        console.log('Results written to extra_tables_columns.txt');

        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkMoreTables();
