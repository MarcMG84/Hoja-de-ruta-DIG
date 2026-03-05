const http = require('http');

http.get('http://localhost:3000/api/route/436609?fecha=2026-02-25', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('--- API RESPONSE for 436609 ---');
            console.log('Vehículo:', parsedData['Vehículo']);
            console.log('Vehiculo:', parsedData['Vehiculo']);
            console.log('calca:', parsedData['calca']);
            console.log('Source:', parsedData['source']);
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
