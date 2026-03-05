-- INIT DATABASE TABLES FOR DIGIROUTA (Export Table)
-- Execute this in your Azure SQL Query Editor (Database: ema)

-- Table for routes completed and saved by operators (History/Export)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HistorialRutas')
BEGIN
    CREATE TABLE HistorialRutas (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        CodigoFull INT,
        Timestamp DATETIME DEFAULT GETDATE(),
        Operario NVARCHAR(MAX),
        Vehiculo NVARCHAR(255),
        Turno NVARCHAR(50),
        DatosJson NVARCHAR(MAX) -- Stores interactive fields (counters, checklist, etc)
    );
    PRINT 'Table HistorialRutas created.';
END
