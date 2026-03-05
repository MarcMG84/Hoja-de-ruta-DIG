document.addEventListener('DOMContentLoaded', () => {
    // Authentication Logic
    const loginOverlay = document.getElementById('login-overlay');
    const appContent = document.getElementById('app-content');
    const loginPass = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    const checkAuth = () => {
        if (sessionStorage.getItem('is_authenticated') === 'true') {
            loginOverlay.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            loginOverlay.style.display = 'flex';
            appContent.style.display = 'none';
        }
    };

    const handleLogin = () => {
        if (loginPass.value === 'Girona1234') {
            sessionStorage.setItem('is_authenticated', 'true');
            checkAuth();
        } else {
            loginError.style.display = 'block';
            loginPass.value = '';
            loginPass.focus();
        }
    };

    loginBtn.onclick = handleLogin;
    loginPass.onkeypress = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    checkAuth();

    let routesData = {};
    const searchInput = document.getElementById('route-search');
    const searchBtn = document.getElementById('search-btn');
    const dateFilter = document.getElementById('date-filter');
    const welcomeScreen = document.getElementById('welcome-screen');
    const sheetContainer = document.getElementById('sheet-container');
    const errorMessage = document.getElementById('error-message');

    // Set today's date by default in the selector
    const today = new Date().toISOString().split('T')[0];
    dateFilter.value = today;

    // Load Data from global variable
    if (typeof ROUTES_DATA !== 'undefined') {
        routesData = ROUTES_DATA;
    } else {
        errorMessage.textContent = 'Error: No s\'han pogut carregar les dades.';
        errorMessage.style.display = 'block';
    }

    // Helper to extract Worker ID from string like "64328 - Borrero Muñoz, Jesús Ramiro (Conductor) (64328)"
    const getWorkerId = (titularStr) => {
        if (!titularStr) return null;
        const match = titularStr.match(/\(([^)]+)\)$/); // Get last part in parenthesis
        return match ? match[1] : null;
    };

    // Search Logic
    const performSearch = async () => {
        const query = searchInput.value.trim();
        const selectedDate = dateFilter.value; // YYYY-MM-DD
        if (!query) return;

        errorMessage.style.display = 'none';
        welcomeScreen.style.display = 'none';
        sheetContainer.style.display = 'none';
        historyScreen.style.display = 'none';

        try {
            // Updated to call your local API with a date parameter for worker searches
            const response = await fetch(`/api/route/${query}?date=${selectedDate}`);

            if (response.ok) {
                const route = await response.json();

                // Optional: Filter by Date if the backend doesn't (checking local consistency)
                const routeDate = route.Fecha ? new Date(route.Fecha).toISOString().split('T')[0] : "";
                if (routeDate && routeDate !== selectedDate) {
                    errorMessage.textContent = `S'ha trobat el full ${query} però pertany al dia ${new Date(route.Fecha).toLocaleDateString()}.`;
                    errorMessage.style.display = 'block';
                    return;
                }

                populateSheet(route);
                sheetContainer.style.display = 'block';
            } else {
                errorMessage.textContent = 'No s\'han trobat resultats per a aquest criteri i data al servidor.';
                errorMessage.style.display = 'block';
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Fallback to local data if server is down
            const allRoutes = Object.values(routesData);
            const match = allRoutes.find(route => {
                const routeDate = route.Fecha ? route.Fecha.split('T')[0] : "";
                if (routeDate !== selectedDate) return false;
                const fullNumber = String(route.Còdigo);
                const workerId = getWorkerId(route.Titular);
                return fullNumber === query || workerId === query;
            });

            if (match) {
                populateSheet(match);
                sheetContainer.style.display = 'block';
            } else {
                errorMessage.textContent = 'Error de connexió amb el servidor i no hi ha dades locals coincidents.';
                errorMessage.style.display = 'block';
            }
        }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    dateFilter.addEventListener('change', performSearch);

    // Button Append Logic
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.onclick = () => {
            const textToAppend = btn.getAttribute('data-append');
            const textarea = btn.closest('.report-buttons').nextElementSibling;
            if (textarea && textarea.tagName === 'TEXTAREA') {
                const tag = `- ${textToAppend}`;
                const currentVal = textarea.value.trim();

                // Duplicate prevention or Toggle OFF
                if (currentVal.includes(tag)) {
                    if (textToAppend === "Vehículo Averiado") {
                        textarea.value = currentVal.replace(tag, "").replace(/\n\n/g, "\n").trim();
                        textarea.dispatchEvent(new Event('input'));
                    }
                    return;
                }

                textarea.value = currentVal ? `${currentVal}\n${tag}` : tag;
                textarea.dispatchEvent(new Event('input'));

                // SPECIAL LOGIC: Trigger secondary vehicle section if it's a breakdown
                if (textToAppend === "Vehicle Avariat") {
                    document.getElementById('secondary-vehicle-section').style.display = 'block';
                }
            }
        };
    });

    // Handle live visibility of secondary vehicle section based on textarea content
    const averiasTextarea = document.getElementById('input-averias');
    const secondarySection = document.getElementById('secondary-vehicle-section');
    if (averiasTextarea && secondarySection) {
        averiasTextarea.addEventListener('input', () => {
            const hasBreakdown = averiasTextarea.value.includes("Vehicle Avariat");
            secondarySection.style.display = hasBreakdown ? 'block' : 'none';
        });
    }

    // Checklist Fuel Toggle Logic
    const fuelCheck = document.getElementById('check-combustible');
    const fuelInput = document.getElementById('input-litros');
    if (fuelCheck && fuelInput) {
        fuelCheck.onchange = () => {
            const isChecked = fuelCheck.checked;
            fuelInput.style.display = isChecked ? 'block' : 'none';

            if (isChecked) {
                // Explicitly ask for liters
                const liters = prompt('Quants litres s\'han proveït?');
                if (liters !== null && liters.trim() !== "") {
                    fuelInput.value = liters;
                    // Trigger events to save
                    fuelInput.dispatchEvent(new Event('input'));
                }
                fuelInput.focus();
            }
        };
    }

    function populateSheet(data) {
        console.log('Populating sheet with data:', data);
        const routeId = data["Còdigo"] || data["C\u00f2digo"] || data["Codigo"] || '-';

        // Basic Info
        document.getElementById('val-codigo').textContent = routeId;
        document.getElementById('val-servicio').textContent = data["Servicio"] || '-';
        document.getElementById('val-centro').textContent = data["Centro"] || '-';
        document.getElementById('val-equipo').textContent = data["Equipo"] || '-';
        document.getElementById('val-sectores').textContent = data["Sectores"] || '-';
        document.getElementById('val-turno').textContent = data["Turno"] || '-';

        const routeDate = data["Fecha"] ? new Date(data["Fecha"]).toLocaleDateString() : "-";
        document.getElementById('val-fecha').textContent = routeDate;

        // Hyper-Robust Vehicle Extraction
        const getExtracted = () => {
            const allStrings = [
                (data["Vehículo"] || ""),
                (data["Vehiculo"] || ""),
                (data.calca || ""),
                (data.mat_raw || ""),
                (data.flota_raw || ""),
                (data.Vehiculo || "")
            ].map(s => s.toString().trim()).filter(s => s && s !== '-');

            const fullText = allStrings.join(' - ');

            // 1. Find Calca (First 4-digit number)
            const calcaMatch = fullText.match(/\d{4}/);
            const c = calcaMatch ? calcaMatch[0] : '-';

            // 2. Find Matricula (Pattern for Spanish plates: E1234ABC or 1234ABC or similar)
            const parts = fullText.split(/[\s\-]+/).map(p => p.trim()).filter(p => p.length >= 4);
            let m = '-';

            const plateRegex = /^[A-Z]?\d{4}[A-Z]{1,3}$/i;
            const possiblePlate = parts.find(p => plateRegex.test(p));
            if (possiblePlate) {
                m = possiblePlate.toUpperCase();
            } else {
                const fallbackPlate = parts.find(p => p.length >= 7 && p !== c);
                m = fallbackPlate || (parts.length > 0 ? parts[0] : '-');
            }

            // 3. Description (Remaining text cleaned)
            let descParts = fullText.split(/[\s\-]+/)
                .map(p => p.trim())
                .filter(p => {
                    const up = p.toUpperCase();
                    return p.length > 2 && up !== c.toUpperCase() && up !== m.toUpperCase();
                });

            // Deduplicate
            const uniqueParts = [];
            descParts.forEach(p => {
                if (!uniqueParts.some(up => up.toUpperCase() === p.toUpperCase())) {
                    uniqueParts.push(p);
                }
            });

            let d = uniqueParts.join(' ') || '-';
            return { calca: c, matricula: m, desc: d };
        };

        const extracted = getExtracted();
        console.log('HYPER-EXTRACTED Vehicle:', extracted);

        const inputMatricula = document.getElementById('val-vehicle-matricula');
        const inputCalca = document.getElementById('val-vehicle-calca');
        const inputDesc = document.getElementById('val-vehicle-desc');

        // Restore or initialize
        const storageKey = `route_data_v2_${routeId}`;
        const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');

        const getVal = (id, def) => {
            const saved = savedData[id];
            if (saved !== undefined && saved !== '-' && saved !== '' && saved !== null) {
                return saved;
            }
            return def;
        };

        if (inputMatricula) inputMatricula.value = getVal('val-vehicle-matricula', extracted.matricula);
        if (inputCalca) inputCalca.value = getVal('val-vehicle-calca', extracted.calca);
        if (inputDesc) inputDesc.value = getVal('val-vehicle-desc', extracted.desc);

        // Personnel
        const personnelList = document.getElementById('personnel-list');
        if (personnelList) {
            personnelList.innerHTML = '';
            if (data["Titular"]) {
                const titFull = data["Titular"];
                const titParts = titFull.split(' - ');
                const codi = titParts[0] ? titParts[0].trim() : '-';
                const nom = titParts.slice(1).join(' - ') ? titParts.slice(1).join(' - ').trim() : titFull;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${data["Puesto"] || 'Operari/a'}</td>
                    <td>${codi}</td>
                    <td>${nom}</td>
                `;
                personnelList.appendChild(row);
            }
        }

        // Observations
        const obs = data["Observaciones"] || '-';
        const obsEl = document.getElementById('val-observaciones');
        if (obsEl) obsEl.textContent = obs;

        // Load interactive fields from localStorage
        loadInteractiveData(routeId);

        // Setup listeners for interactive fields
        setupPersistence(routeId);
    }

    function setupPersistence(routeId) {
        const fields = [
            'input-horo-sortida', 'input-km-sortida', 'input-horo-aux-sortida', 'input-hora-sortida',
            'input-desc-1-sortida', 'input-desc-2-sortida', 'input-desc-3-sortida',
            'input-horo-arribada', 'input-km-arribada', 'input-horo-aux-arribada', 'input-hora-arribada',
            'input-desc-1-arribada', 'input-desc-2-arribada', 'input-desc-3-arribada',
            'input-incidencias', 'input-averias',
            'check-cinturo', 'check-ruedas', 'check-extintor', 'check-llums',
            'check-oli-hidraulic', 'check-oli-motor', 'check-refrigerant',
            'check-combustible', 'input-litros',
            // Vehicle Overrides
            'val-vehicle-matricula', 'val-vehicle-calca', 'val-vehicle-desc',
            // V2 Fields
            'v2-matricula', 'v2-check-cinturo', 'v2-check-ruedas', 'v2-check-extintor',
            'v2-check-llums', 'v2-check-oli-motor', 'v2-check-refrigerant',
            'v2-horo-sortida', 'input-v2-km-sortida', 'v2-horo-aux-sortida', 'v2-hora-sortida',
            'v2-horo-arribada', 'v2-km-arribada', 'v2-horo-aux-arribada', 'v2-hora-arribada'
        ];

        fields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const isCheckbox = el.type === 'checkbox';

            el.oninput = el.onchange = () => {
                const storageKey = `route_data_v2_${routeId}`;
                const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
                currentData[id] = isCheckbox ? el.checked : el.value;
                localStorage.setItem(storageKey, JSON.stringify(currentData));
            };
        });
    }

    function loadInteractiveData(routeId) {
        const storageKey = `route_data_v2_${routeId}`;
        const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');

        const fields = [
            'input-horo-sortida', 'input-km-sortida', 'input-horo-aux-sortida', 'input-hora-sortida',
            'input-desc-1-sortida', 'input-desc-2-sortida', 'input-desc-3-sortida',
            'input-horo-arribada', 'input-km-arribada', 'input-horo-aux-arribada', 'input-hora-arribada',
            'input-desc-1-arribada', 'input-desc-2-arribada', 'input-desc-3-arribada',
            'input-incidencias', 'input-averias',
            'check-cinturo', 'check-ruedas', 'check-extintor', 'check-llums',
            'check-oli-hidraulic', 'check-oli-motor', 'check-refrigerant',
            'check-combustible', 'input-litros',
            // Vehicle Overrides are managed in populateSheet to allow smart extraction defaults
            // V2 Fields
            'v2-matricula', 'v2-check-cinturo', 'v2-check-ruedas', 'v2-check-extintor',
            'v2-check-llums', 'v2-check-oli-motor', 'v2-check-refrigerant',
            'v2-horo-sortida', 'input-v2-km-sortida', 'v2-horo-aux-sortida', 'v2-hora-sortida',
            'v2-horo-arribada', 'v2-km-arribada', 'v2-horo-aux-arribada', 'v2-hora-arribada'
        ];

        fields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (el.type === 'checkbox') {
                el.checked = !!savedData[id];
            } else {
                el.value = savedData[id] || '';
            }
        });

        // Ensure fuel input visibility is correct on load
        const fuelCheck = document.getElementById('check-combustible');
        const fuelInput = document.getElementById('input-litros');
        if (fuelCheck && fuelInput) {
            fuelInput.style.display = fuelCheck.checked ? 'block' : 'none';
        }

        // Toggle secondary section visibility based on breakdown presence
        const hasBreakdown = (savedData['input-averias'] || "").includes("Vehicle Avariat");
        const secondarySection = document.getElementById('secondary-vehicle-section');
        if (secondarySection) {
            secondarySection.style.display = hasBreakdown ? 'block' : 'none';
        }
    }

    // --- NEW HISTORY LOGIC ---

    const historyScreen = document.getElementById('history-screen');
    const historyTableBody = document.getElementById('history-table-body');
    const noHistoryMsg = document.getElementById('no-history-msg');
    const historySearch = document.getElementById('history-search');

    // Navigation
    const showScreen = (screenId) => {
        welcomeScreen.style.display = screenId === 'welcome' ? 'flex' : 'none';
        sheetContainer.style.display = screenId === 'sheet' ? 'block' : 'none';
        historyScreen.style.display = screenId === 'history' ? 'block' : 'none';
        errorMessage.style.display = 'none';

        if (screenId === 'history') {
            renderHistory();
        }
    };

    const historyNavBtn = document.getElementById('history-nav-btn');
    if (historyNavBtn) historyNavBtn.onclick = () => showScreen('history');

    const backToMainBtn = document.getElementById('back-to-main-btn');
    if (backToMainBtn) backToMainBtn.onclick = () => showScreen('welcome');

    // Save Logic
    const saveBtn = document.getElementById('save-to-history-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const routeId = document.getElementById('val-codigo').textContent;
            if (!routeId || routeId === '-') return;

            const personnelRows = document.querySelectorAll('#personnel-list tr');
            let operarios = [];
            personnelRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) operarios.push(cells[2].innerText);
            });
            const operarioText = operarios.join(', ') || '-';

            const matriculaInput = document.getElementById('val-vehicle-matricula');
            const calcaInput = document.getElementById('val-vehicle-calca');
            const matricula = matriculaInput ? matriculaInput.value || '-' : '-';
            const calca = calcaInput ? calcaInput.value || '-' : '-';
            const vehiculo = `${calca} / ${matricula}`;

            const turnoEl = document.getElementById('val-turno');
            const fechaEl = document.getElementById('val-fecha');
            const sectorEl = document.getElementById('val-sectores');

            const turno = turnoEl ? turnoEl.textContent || '-' : '-';
            const fechaText = fechaEl ? fechaEl.textContent : '';

            const storageKey = `route_data_v2_${routeId}`;
            const inputData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            inputData['val-vehicle-matricula'] = matricula;

            const historyEntry = {
                routeId: routeId,
                fecha: fechaText.split('/').reverse().join('-'),
                operario: operarioText,
                vehiculo: vehiculo,
                turno: turno,
                sector: (sectorEl ? sectorEl.textContent || '-' : '-').replace('Sector a realizar - ', '').trim(),
                details: inputData
            };

            try {
                const response = await fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(historyEntry)
                });

                if (response.ok) {
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '✅ DESAT A AZURE';
                    saveBtn.style.background = 'var(--success-green)';
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText;
                        saveBtn.style.background = 'var(--primary-blue)';
                    }, 2000);
                }
            } catch (err) {
                console.error('Save error:', err);
                alert('Error en desar al servidor.');
            }
        };
    }

    // Render History
    async function renderHistory() {
        let history = [];
        try {
            const response = await fetch('/api/history');
            if (response.ok) history = await response.json();
        } catch (err) {
            console.error('Fetch history error:', err);
        }

        const searchTerm = historySearch.value.toLowerCase();
        const filtered = history.filter(h => {
            return String(h.routeId).toLowerCase().includes(searchTerm) ||
                String(h.operario).toLowerCase().includes(searchTerm) ||
                String(h.vehiculo).toLowerCase().includes(searchTerm);
        });

        if (historyTableBody) {
            historyTableBody.innerHTML = '';

            if (filtered.length === 0) {
                if (noHistoryMsg) noHistoryMsg.style.display = 'block';
                return;
            }

            if (noHistoryMsg) noHistoryMsg.style.display = 'none';

            filtered.forEach(entry => {
                const tr = document.createElement('tr');
                const dateStr = new Date(entry.fecha).toLocaleDateString();

                const details = entry.details || {};
                const kmVal = `${details['input-km-sortida'] || '-'} / ${details['input-km-arribada'] || '-'}`;
                const horoVal = `${details['input-horo-sortida'] || '-'} / ${details['input-horo-arribada'] || '-'}`;

                const checkIds = ['check-cinturo', 'check-ruedas', 'check-extintor', 'check-llums', 'check-oli-hidraulic', 'check-oli-motor', 'check-refrigerant'];
                const checkedCount = checkIds.filter(id => details[id] === true).length;
                const revStatus = checkedCount === checkIds.length ? '<span style="color:green">✅</span>' :
                    (checkedCount > 0 ? `<span style="color:orange">${checkedCount}/7</span>` : '<span style="color:red">❌</span>');

                let carga = '-';
                const loadMatch = (details['input-incidencias'] || "").match(/Carregat: ([^.\n,]+)/i);
                if (loadMatch) carga = loadMatch[1].trim();

                const plate = details['val-vehicle-matricula'] || (entry.vehiculo.split(' / ')[1] || '-');
                let sector = entry.sector || '-';
                sector = sector.replace('Sector a realizar - ', '').trim();

                tr.innerHTML = `
                    <td style="padding: 12px; border: 1px solid #ddd;">${dateStr}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${entry.routeId}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${plate}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${kmVal}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${horoVal}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.75rem;">${sector}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${revStatus}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${carga}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.75rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${details['input-incidencias'] || ''}">${details['input-incidencias'] || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${entry.operario}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                        <button class="action-btn view-btn" data-id="${entry.routeId}">VEURE</button>
                        <button class="action-btn delete-btn" data-id="${entry.id}">ELIMINAR</button>
                    </td>
                `;

                tr.querySelector('.view-btn').onclick = async () => {
                    const response = await fetch(`/api/route/${entry.routeId}`);
                    if (response.ok) {
                        const freshData = await response.json();
                        populateSheet(freshData);
                        setTimeout(() => {
                            const inputs = document.querySelectorAll('.interactive-input, .checklist-item input, .sheet-input');
                            inputs.forEach(input => {
                                const key = input.id;
                                if (entry.details && entry.details[key] !== undefined) {
                                    if (input.type === 'checkbox') input.checked = entry.details[key];
                                    else input.value = entry.details[key];
                                }
                            });
                        }, 100);
                        showScreen('sheet');
                    }
                };

                tr.querySelector('.delete-btn').onclick = async () => {
                    if (confirm('Segur que vols eliminar-ho d\'Azure?')) {
                        const res = await fetch(`/api/history/${entry.id}`, { method: 'DELETE' });
                        if (res.ok) renderHistory();
                    }
                };

                historyTableBody.appendChild(tr);
            });
        }
    }

    if (historySearch) historySearch.oninput = renderHistory;
});
