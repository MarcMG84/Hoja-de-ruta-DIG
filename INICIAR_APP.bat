@echo off
TITLE Hoja de Ruta DIG - Inicia el Servidor
echo [1/2] Iniciant el servidor Node.js...
start /b npm start
echo [2/2] Esperant que el servidor estigui llest...
timeout /t 3 /nobreak > nul
echo Obrint l'aplicació al navegador...
start http://localhost:3000
echo.
echo L'aplicació ja està en marxa. 
echo No tanquis aquesta finestra si vols seguir fent servir la web.
echo.
pause
