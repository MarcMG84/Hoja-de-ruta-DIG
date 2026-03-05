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

async function listCols() {
    try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'vision' AND TABLE_NAME = 'estado_gps'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Columns in vision.estado_gps:');
        console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));

        const data = await pool.request().query("SELECT TOP 1 * FROM vision.estado_gps WHERE num_hoja = '436609'");
        if (data.recordset.length > 0) {
            console.log('\nData for 436609:');
            console.log(JSON.stringify(data.recordset[0], null, 2));
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listCols();
