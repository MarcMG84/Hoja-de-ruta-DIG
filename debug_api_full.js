const fetch = require('node-fetch');
const fs = require('fs');

async function debug() {
    try {
        const res = await fetch('http://localhost:3000/api/route/436609?date=2026-02-25');
        const json = await res.json();
        fs.writeFileSync('api_response_debug.json', JSON.stringify(json, null, 2));
        console.log('✓ Full API response written to api_response_debug.json');
        console.log('Keys in response:', Object.keys(json));
        console.log('calca:', json.calca);
        console.log('mat_raw:', json.mat_raw);
        console.log('Vehiculo:', json.Vehiculo);
    } catch (e) {
        console.error('Debug failed:', e.message);
    }
}
debug();
