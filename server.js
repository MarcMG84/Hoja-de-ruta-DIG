const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

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
                    (ISNULL(vehiculo, '') + ' - ' + ISNULL(flota, '')) AS [Vehículo],
                    (ISNULL(vehiculo, '') + ' - ' + ISNULL(flota, '')) AS Vehiculo,
                    vehiculo AS calca,
                    flota AS mat_raw,
                    titular AS Titular,
                    itinerario AS Sectores,
                    turno AS Turno,
                    ob2_hor AS Observaciones,
                    'estado_gps' as source
                FROM vision.estado_gps 
                ${whereClauseGP}
                ORDER BY fecha_hoja_ruta DESC
            `);

            // Deep Search: If not found, OR found but without vehicle, try in vision.seguimiento_tramos
            const hasVehicle = (row) => {
                if (!row) return false;
                const v = (row.calca || '').toString().trim();
                const m = (row.mat_raw || '').toString().trim();
                return (v && v !== '-') || (m && m !== '-');
            };

            if (result.recordset.length === 0 || !hasVehicle(result.recordset[0])) {
                const segResult = await request.query(`
                    SELECT TOP 1
                        code AS Codigo,
                        code AS [Còdigo],
                        fec_hor AS Fecha,
                        ser AS Servicio,
                        den_cen AS Centro,
                        den AS Equipo,
                        (ISNULL(cal_cal, '') + ' - ' + ISNULL(mat_hor, '')) AS [Vehículo],
                        (ISNULL(cal_cal, '') + ' - ' + ISNULL(mat_hor, '')) AS Vehiculo,
                        cal_cal AS calca,
                        mat_hor AS mat_raw,
                        titular AS Titular,
                        obs AS Sectores,
                        tur AS Turno,
                        ob2_hor AS Observaciones,
                        'seguimiento_tramos' as source
                    FROM vision.seguimiento_tramos 
                    ${whereClauseSEG}
                    ORDER BY fec_hor DESC
                `);

                // If still the second query actually found something better, use it. 
                // Otherwise keep the original result if it exists.
                if (segResult.recordset.length > 0) {
                    if (result.recordset.length === 0 || hasVehicle(segResult.recordset[0])) {
                        result = segResult;
                    }
                }
            }

            // FINAL FALLBACK: If we have a row but NO vehicle, look for the most recent assignment for this 'Equip'
            if (result.recordset.length > 0 && !hasVehicle(result.recordset[0])) {
                const equip = result.recordset[0].Equipo;
                if (equip && equip !== '-') {
                    const histResult = await pool.request().query(`
                        SELECT TOP 1
                            vehiculo AS calca,
                            flota AS mat_raw,
                            (ISNULL(vehiculo, '') + ' - ' + ISNULL(flota, '')) AS [Vehículo],
                            (ISNULL(vehiculo, '') + ' - ' + ISNULL(flota, '')) AS Vehiculo
                        FROM vision.estado_gps 
                        WHERE ruta = '${equip.replace(/'/g, "''")}' 
                          AND vehiculo IS NOT NULL 
                          AND vehiculo <> '' 
                          AND vehiculo <> ' - '
                        ORDER BY fecha_hoja_ruta DESC
                    `);

                    if (histResult.recordset.length > 0) {
                        const hist = histResult.recordset[0];
                        result.recordset[0].calca = hist.calca;
                        result.recordset[0].mat_raw = hist.mat_raw;
                        result.recordset[0].Vehiculo = hist.Vehiculo;
                        result.recordset[0]["Vehículo"] = hist["Vehículo"];
                        result.recordset[0].source += ' + historical_fallback';
                    }
                }
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
        const { routeId, operario, vehiculo, turno, details, fecha } = req.body;
        try {
            await pool.request()
                .input('routeId', sql.NVarChar, routeId)
                .input('operario', sql.NVarChar, operario)
                .input('vehiculo', sql.NVarChar, vehiculo)
                .input('turno', sql.NVarChar, turno)
                .input('fecha', sql.DateTime, fecha)
                .input('details', sql.NVarChar, JSON.stringify(details))
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HistorialRutas')
                    BEGIN
                        CREATE TABLE HistorialRutas (
                            ID INT IDENTITY(1,1) PRIMARY KEY,
                            CodigoFull NVARCHAR(50),
                            Timestamp DATETIME DEFAULT GETDATE(),
                            FechaRuta DATETIME,
                            Operario NVARCHAR(MAX),
                            Vehiculo NVARCHAR(255),
                            Turno NVARCHAR(50),
                            DatosJson NVARCHAR(MAX)
                        );
                    END

                    INSERT INTO HistorialRutas (CodigoFull, Operario, Vehiculo, Turno, DatosJson, FechaRuta)
                    VALUES (@routeId, @operario, @vehiculo, @turno, @details, @fecha)
                `);
            res.sendStatus(201);
        } catch (err) {
            console.error('Save error:', err.message);
            res.status(500).send(err.message);
        }
    });

    // 3. GET HISTORY LIST
    app.get('/api/history', async (req, res) => {
        try {
            const tableExists = await pool.request().query("SELECT * FROM sys.tables WHERE name = 'HistorialRutas'");
            if (tableExists.recordset.length === 0) return res.json([]);

            const result = await pool.request().query('SELECT * FROM HistorialRutas ORDER BY Timestamp DESC');
            // Map keys for frontend compatibility
            const list = result.recordset.map(h => ({
                id: h.ID,
                routeId: h.CodigoFull,
                timestamp: h.Timestamp,
                fecha: h.FechaRuta,
                operario: h.Operario,
                vehiculo: h.Vehiculo,
                turno: h.Turno,
                details: JSON.parse(h.DatosJson || '{}')
            }));
            res.json(list);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // 4. DELETE HISTORY ENTRY
    app.delete('/api/history/:id', async (req, res) => {
        try {
            await pool.request()
                .input('id', sql.Int, req.params.id)
                .query('DELETE FROM HistorialRutas WHERE ID = @id');
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

}).catch(err => console.error('❌ Database connection failed:', err));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// All other routes serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
