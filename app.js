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
        errorMessage.textContent = 'Error: No se han podido cargar los datos.';
        errorMessage.style.display = 'block';
    }

    // Helper to extract Worker ID from string like "64328 - Borrero Muñoz, Jesús Ramiro (Conductor) (64328)"
    const getWorkerId = (titularStr) => {
        if (!titularStr) return null;
        const match = titularStr.match(/\(([^)]+)\)$/); // Get last part in parenthesis
        return match ? match[1] : null;
    };

    // Search Logic
    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        const selectedDate = dateFilter.value; // YYYY-MM-DD
        if (!query) return;

        errorMessage.style.display = 'none';
        welcomeScreen.style.display = 'none';
        sheetContainer.style.display = 'none';

        // Find matches
        const allRoutes = Object.values(routesData);
        const match = allRoutes.find(route => {
            // 1. Filter by Date (comparing only the YYYY-MM-DD part)
            const routeDate = route.Fecha ? route.Fecha.split('T')[0] : "";
            if (routeDate !== selectedDate) return false;

            // 2. Filter by Query (Nº Full OR Worker ID)
            const fullNumber = String(route.Còdigo);
            const workerId = getWorkerId(route.Titular);

            return fullNumber === query || workerId === query;
        });

        if (match) {
            populateSheet(match);
            sheetContainer.style.display = 'block';
        } else {
            errorMessage.textContent = 'No se han encontrado resultados para este criterio y fecha.';
            errorMessage.style.display = 'block';
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
                if (textToAppend === "Vehículo Averiado") {
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
            const hasBreakdown = averiasTextarea.value.includes("Vehículo Averiado");
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
                const liters = prompt('¿Cuántos litros se han repostado?');
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
        const routeId = data["C\u00f2digo"] || data["Còdigo"] || '-';

        // Basic Info
        document.getElementById('val-codigo').textContent = routeId;
        document.getElementById('val-servicio').textContent = data["Servicio"] || '-';
        document.getElementById('val-centro').textContent = data["Centro"] || '-';
        document.getElementById('val-equipo').textContent = data["Equipo"] || '-';
        document.getElementById('val-sectores').textContent = data["Sectores"] || '-';
        document.getElementById('val-turno').textContent = data["Turno"] || '-';

        // Date formatting
        if (data["Fecha"]) {
            const date = new Date(data["Fecha"]);
            document.getElementById('val-fecha').textContent = date.toLocaleDateString('es-ES');
        }

        // Vehicle Info Parsing
        // Expected format: "9133 - E9133BHV - B.ASPIR ..."
        const vehFull = data["Veh\u00edculo"] || "";
        const vehParts = vehFull.split(' - ');
        if (vehParts.length >= 2) {
            document.getElementById('val-vehicle-calca').textContent = vehParts[0].trim();
            document.getElementById('val-vehicle-matricula').textContent = vehParts[1].trim();
            document.getElementById('val-vehicle-desc').textContent = vehParts.slice(2).join(' - ').trim();
        } else {
            document.getElementById('val-vehicle-desc').textContent = vehFull || '-';
            document.getElementById('val-vehicle-calca').textContent = '-';
            document.getElementById('val-vehicle-matricula').textContent = '-';
        }

        // Personnel
        const personnelList = document.getElementById('personnel-list');
        personnelList.innerHTML = '';
        if (data["Titular"]) {
            // "64328 - Borrero Muñoz, Jesús Ramiro (Conductor) (64328)"
            const titFull = data["Titular"];
            const titParts = titFull.split(' - ');
            const codi = titParts[0] || '';
            const nom = titParts.slice(1).join(' - ') || '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data["Puesto"] || '[VCD] Conductor'}</td>
                <td>${codi}</td>
                <td>${nom}</td>
            `;
            personnelList.appendChild(row);
        }

        // Observations
        const obs = data["Observaciones"] || '-';
        document.getElementById('val-observaciones').textContent = obs;

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
        const hasBreakdown = (savedData['input-averias'] || "").includes("Vehículo Averiado");
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

    document.getElementById('history-nav-btn').onclick = () => showScreen('history');
    document.getElementById('back-to-main-btn').onclick = () => showScreen('welcome');

    // Save Logic
    const saveBtn = document.getElementById('save-to-history-btn');
    saveBtn.onclick = () => {
        const routeId = document.getElementById('val-codigo').textContent;
        if (!routeId || routeId === '-') return;

        // Gather all current data
        const storageKey = `route_data_v2_${routeId}`;
        const inputData = JSON.parse(localStorage.getItem(storageKey) || '{}');

        // Static data from the match
        const allRoutes = Object.values(routesData);
        const originalRoute = allRoutes.find(r => String(r.Còdigo) === routeId);

        const historyEntry = {
            id: Date.now(),
            routeId: routeId,
            timestamp: new Date().toISOString(),
            fecha: originalRoute ? originalRoute.Fecha : new Date().toISOString(),
            operario: originalRoute ? originalRoute.Titular : '-',
            vehiculo: originalRoute ? originalRoute.Vehículo : '-',
            turno: originalRoute ? originalRoute.Turno : '-',
            details: inputData
        };

        const history = JSON.parse(localStorage.getItem('dig_history') || '[]');
        // Check if already exists (update or add)
        const existingIdx = history.findIndex(h => h.routeId === routeId);
        if (existingIdx > -1) {
            history[existingIdx] = historyEntry;
        } else {
            history.push(historyEntry);
        }

        localStorage.setItem('dig_history', JSON.stringify(history));

        // Feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✅ GUARDADO CORRECTAMENTE';
        saveBtn.style.background = 'var(--success-green)';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = 'var(--primary-blue)';
        }, 2000);
    };

    // Render History
    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('dig_history') || '[]');
        const searchTerm = historySearch.value.toLowerCase();

        const filtered = history.filter(h => {
            return h.routeId.toLowerCase().includes(searchTerm) ||
                h.operario.toLowerCase().includes(searchTerm) ||
                h.vehiculo.toLowerCase().includes(searchTerm);
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        historyTableBody.innerHTML = '';

        if (filtered.length === 0) {
            noHistoryMsg.style.display = 'block';
            return;
        }

        noHistoryMsg.style.display = 'none';

        filtered.forEach(entry => {
            const tr = document.createElement('tr');
            const dateStr = new Date(entry.fecha).toLocaleDateString();

            tr.innerHTML = `
                <td style="padding: 12px; border: 1px solid #ddd;">${dateStr}</td>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${entry.routeId}</td>
                <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${entry.operario}</td>
                <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.8rem;">${entry.vehiculo}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                    <button class="action-btn view-btn" data-id="${entry.routeId}">VER</button>
                    <button class="action-btn delete-btn" data-timestamp="${entry.id}">ELIMINAR</button>
                </td>
            `;

            tr.querySelector('.view-btn').onclick = () => {
                const routeId = entry.routeId;
                const match = Object.values(routesData).find(r => String(r.Còdigo) === routeId);
                if (match) {
                    populateSheet(match);
                    showScreen('sheet');
                }
            };

            tr.querySelector('.delete-btn').onclick = () => {
                if (confirm('¿Seguro que quieres eliminar este registro del historial?')) {
                    const currentHistory = JSON.parse(localStorage.getItem('dig_history') || '[]');
                    const newHistory = currentHistory.filter(h => h.id !== entry.id);
                    localStorage.setItem('dig_history', JSON.stringify(newHistory));
                    renderHistory();
                }
            };

            historyTableBody.appendChild(tr);
        });
    }

    historySearch.oninput = renderHistory;
});
