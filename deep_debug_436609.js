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

async function findData() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('--- SEARCHING IN vision.estado_gps ---');
        let resGP = await pool.request().query("SELECT * FROM vision.estado_gps WHERE num_hoja = '436609'");
        console.log('Results in estado_gps:', resGP.recordset.length);
        if (resGP.recordset.length > 0) console.log(resGP.recordset[0]);

        console.log('\n--- SEARCHING IN vision.seguimiento_tramos ---');
        let resSEG = await pool.request().query("SELECT * FROM vision.seguimiento_tramos WHERE code = '436609'");
        console.log('Results in seguimiento_tramos:', resSEG.recordset.length);
        if (resSEG.recordset.length > 0) console.log(resSEG.recordset[0]);

        console.log('\n--- SEARCHING ALL TABLES FOR "436609" ---');
        // This might be slow, let's just check the most likely ones
        const tables = ['vision.hr_control_srmtsr', 'vision.personal_disponible', 'vision.rutas_planificadas'];
        for (const table of tables) {
            try {
                let res = await pool.request().query(`SELECT TOP 1 * FROM ${table} WHERE num_hoja = '436609' OR code = '436609'`);
                if (res.recordset.length > 0) {
                    console.log(`Match found in ${table}:`);
                    console.log(res.recordset[0]);
                }
            } catch (e) { }
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

findData();
