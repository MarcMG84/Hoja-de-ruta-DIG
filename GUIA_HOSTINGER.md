# Guia de Desplegament: Hostinger (Node.js)

Aquesta guia t'ajudarà a pujar l'aplicació a Hostinger de forma correcta.

## 1. Preparació del paquet (Nova Estructura)
Hem organitzat els fitxers per ser 100% compatibles amb Hostinger. Has de comprimir els següents fitxers/carpetes en un fitxer `.zip`:

**S'ha d'incloure:**
- La carpeta **`public/`** (que conté `index.html`, `style.css`, etc.)
- `server.js`
- `package.json`
- `package-lock.json`

> [!IMPORTANT]
> **NO incloguis la carpeta `node_modules`** ni els fitxers de `debug_*.js` o `check_*.js`.

## 2. Configuració a Hostinger (Panell hPanel)
1. Ves a la secció **Node.js** del teu panell de Hostinger.
2. Crea una nova aplicació Node.js.
3. Puja el teu fitxer `.zip` al directori de l'app.
4. Estableix el fitxer principal com a `server.js`.

## 3. Variables d'Entorn (.env)
A Hostinger, no se sol utilitzar el fitxer `.env` directament pel control de seguretat. Has de buscar la secció **"Variables de Entorno"** o **"Environment Variables"** dins de la configuració de Node.js i afegir les següents que tenies al teu ordinador:

| Clau | Valor |
| :--- | :--- |
| `DB_SERVER` | `utesanejamentgirona.database.windows.net` |
| `DB_NAME` | `ema` |
| `DB_USER` | `ema` |
| `DB_PASSWORD` | `Asccf.209051` |
| `PORT` | `3000` (o el que et proposi Hostinger per defecte) |

## 4. Instal·lació de dependències
Un cop pujat tot, prem el botó **"npm install"** al panell de Hostinger per instal·lar les llibreries.

## 5. Accés des d'Azure (MOLT IMPORTANT)
Azure SQL té un tallafocs (Firewall). 
1. Has de saber quina és la **IP del servidor de Hostinger**.
2. Entra al portal d'Azure -> SQL Database -> Redes.
3. Afegeix una "Regla de firewall" amb la IP de Hostinger per permetre que el servidor s'hi connecti.

## 6. Llest!
Inicia l'aplicació des del botó **"Start"** o **"Restart"** de Hostinger i ja hauria d'estar accessible via la teva URL.
