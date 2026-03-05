const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Azure SQL Configuration (Stored in .env)
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

// Connect to Database
sql.connect(dbConfig).then(pool => {
    console.log('✅ Connected to Azure SQL');

    // --- API ROUTES ---

    // 1. GET ROUTE BY ID OR WORKER ID (PLANNING)
    app.get('/api/route/:id', async (req, res) => {
        try {
            const queryId = req.params.id;
            const searchDate = req.query.date; // Optional date filter (YYYY-MM-DD)

            let request = pool.request().input('id', sql.NVarChar, queryId);
            let whereClauseGP = "WHERE CAST(num_hoja AS NVARCHAR) = @id OR titular LIKE '%' + @id + '%'";
            let whereClauseSEG = "WHERE CAST(code AS NVARCHAR) = @id OR titular LIKE '%' + @id + '%'";

            if (searchDate) {
                request.input('date', sql.Date, searchDate);
                whereClauseGP += " AND CAST(fecha_hoja_ruta AS DATE) = @date";
                whereClauseSEG += " AND CAST(fec_hor AS DATE) = @date";
            }

            // Try in vision.estado_gps first
            let result = await request.query(`
                SELECT TOP 1
                    num_hoja AS Codigo,
                    num_hoja AS [Còdigo],
                    fecha_hoja_ruta AS Fecha,
                    servicio AS Servicio,
                    '1028 - PARQUE CENTRAL GIRONA' AS Centro,
                    ruta AS Equipo, 
                    (vehiculo + ' - ' + ISNULL(flota, '')) AS [Vehículo],
                    (vehiculo + ' - ' + ISNULL(flota, '')) AS Vehiculo,
                    titular AS Titular,
                    itinerario AS Sectores,
                    turno AS Turno,
                    ob2_hor AS Observaciones,
                    'estado_gps' as source
                FROM vision.estado_gps 
                ${whereClauseGP}
                ORDER BY fecha_hoja_ruta DESC
            `);

            // If not found, try in vision.seguimiento_tramos
            if (result.recordset.length === 0) {
                result = await request.query(`
                    SELECT TOP 1
                        code AS Codigo,
                        code AS [Còdigo],
                        fec_hor AS Fecha,
                        ser AS Servicio,
                        den_cen AS Centro,
                        den AS Equipo,
                        mat_hor AS [Vehículo],
                        mat_hor AS Vehiculo,
                        titular AS Titular,
                        obs AS Sectores,
                        tur AS Turno,
                        ob2_hor AS Observaciones,
                        'seguimiento_tramos' as source
                    FROM vision.seguimiento_tramos 
                    ${whereClauseSEG}
                    ORDER BY fec_hor DESC
                `);
            }

            if (result.recordset.length > 0) {
                res.json(result.recordset[0]);
            } else {
                res.status(404).send('No se ha encontrado ninguna hoja para este criterio y fecha.');
            }
        } catch (err) {
            console.error('API Error:', err.message);
            res.status(500).send(err.message);
        }
    });

    // 2. SAVE HISTORY (EXPORT)
    app.post('/api/history', async (req, res) => {
        const { routeId, operario, vehiculo, turno, details } = req.body;
        try {
            // Ensure the table exists before inserting (or handle it in init_db.sql)
            await pool.request()
                .input('routeId', sql.Int, routeId)
                .input('operario', sql.NVarChar, operario)
                .input('vehiculo', sql.NVarChar, vehiculo)
                .input('turno', sql.NVarChar, turno)
                .input('details', sql.NVarChar, JSON.stringify(details))
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HistorialRutas')
                    BEGIN
                        CREATE TABLE HistorialRutas (
                            ID INT IDENTITY(1,1) PRIMARY KEY,
                            CodigoFull INT,
                            Timestamp DATETIME DEFAULT GETDATE(),
                            Operario NVARCHAR(MAX),
                            Vehiculo NVARCHAR(255),
                            Turno NVARCHAR(50),
                            DatosJson NVARCHAR(MAX)
                        );
                    END

                    INSERT INTO HistorialRutas (CodigoFull, Operario, Vehiculo, Turno, DatosJson)
                    VALUES (@routeId, @operario, @vehiculo, @turno, @details)
                `);
            res.sendStatus(201);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // 3. GET HISTORY LIST
    app.get('/api/history', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM HistorialRutas ORDER BY Timestamp DESC');
            res.json(result.recordset);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

}).catch(err => console.error('❌ Database connection failed:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
