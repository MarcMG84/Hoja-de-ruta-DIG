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

async function findHistory() {
    try {
        let pool = await sql.connect(dbConfig);
        let finalResults = '✅ History Finding Results\n\n';

        const tables = [
            'srmtsr', 'seguimiento_tramos', 'responsable', 'srm_responsable',
            'hr_control_salida', 'estado_gps', 'porcentage', 'tramos_no_realizado'
        ];

        for (const table of tables) {
            finalResults += `\n--- TABLE: vision.${table} ---\n`;
            try {
                const schema = await pool.request().query(`
                    SELECT COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'vision' AND TABLE_NAME = '${table}'
                `);

                const dateCols = schema.recordset.filter(c =>
                    c.DATA_TYPE.toLowerCase().includes('date') ||
                    c.DATA_TYPE.toLowerCase().includes('time') ||
                    c.COLUMN_NAME.toLowerCase().includes('fecha') ||
                    c.COLUMN_NAME.toLowerCase().includes('fec_')
                );

                if (dateCols.length > 0) {
                    finalResults += `Detected date columns: ${dateCols.map(c => c.COLUMN_NAME).join(', ')}\n`;
                    for (const col of dateCols) {
                        const range = await pool.request().query(`
                            SELECT MIN(${col.COLUMN_NAME}) as minDate, MAX(${col.COLUMN_NAME}) as maxDate, COUNT(*) as total 
                            FROM vision.${table}
                        `);
                        finalResults += `  [${col.COLUMN_NAME}] Total: ${range.recordset[0].total}, Min: ${range.recordset[0].minDate}, Max: ${range.recordset[0].maxDate}\n`;
                    }
                } else {
                    finalResults += 'No date columns found.\n';
                }
            } catch (e) {
                finalResults += `Error querying ${table}: ${e.message}\n`;
            }
        }

        fs.writeFileSync('history_finding_results.txt', finalResults);
        console.log('Results written to history_finding_results.txt');
        await sql.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

findHistory();
