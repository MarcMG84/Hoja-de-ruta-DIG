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

async function verifyWorkerSearch() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL');

        // Find a worker ID and date
        const sample = await pool.request().query("SELECT TOP 1 num_hoja, titular, fecha_hoja_ruta FROM vision.estado_gps WHERE titular IS NOT NULL AND fecha_hoja_ruta IS NOT NULL");
        if (sample.recordset.length > 0) {
            let { titular, fecha_hoja_ruta } = sample.recordset[0];
            const workerIdMatch = titular.match(/\(([^)]+)\)$/);
            const workerId = workerIdMatch ? workerIdMatch[1] : null;

            // Handle if fecha_hoja_ruta is not a Date object
            const d = new Date(fecha_hoja_ruta);
            const dateStr = d.toISOString().split('T')[0];

            console.log(`Searching for Worker ID: ${workerId} on Date: ${dateStr}`);

            // Test API - Simulate fetch
            const http = require('http');
            http.get(`http://localhost:3000/api/route/${workerId}?date=${dateStr}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('API Response (Worker Search):');
                    console.log(data);
                    sql.close();
                });
            }).on('error', (err) => {
                console.error('Fetch error:', err.message);
                sql.close();
            });
        } else {
            console.log('No records found to test.');
            await sql.close();
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

verifyWorkerSearch();
