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

async function findVehicle() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('--- SEARCHING FOR "E9135BHV" ---');

        const queries = [
            "SELECT TOP 5 * FROM vision.estado_gps WHERE vehiculo LIKE '%E9135BHV%' OR flota LIKE '%E9135BHV%'",
            "SELECT TOP 5 * FROM vision.seguimiento_tramos WHERE mat_hor LIKE '%E9135BHV%' OR cal_cal LIKE '%E9135BHV%'",
            "SELECT TOP 5 * FROM vision.hr_control_srmtsr WHERE mat_hor LIKE '%E9135BHV%'",
            "SELECT TOP 5 * FROM vision.rutas_planificadas WHERE matricula LIKE '%E9135BHV%'"
        ];

        for (const query of queries) {
            try {
                let res = await pool.request().query(query);
                if (res.recordset.length > 0) {
                    console.log(`\nMatch found for query: ${query}`);
                    console.log(JSON.stringify(res.recordset[0], null, 2));
                }
            } catch (e) { }
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

findVehicle();
