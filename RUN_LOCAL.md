# Ejecución local rápida

## Opción 1: Node.js (backend + frontend)

1. Instalar dependencias backend:
   ```bash
   cd backend && npm install
   ```
2. Iniciar servidor:
   ```bash
   node backend/server.js
   ```
3. Abrir en navegador:
   - Standalone: `http://localhost:8086/index.html?mode=standalone`
   - SAP por query params: `http://localhost:8086/index.html?mode=sap&documentType=CC&documentNumber=12345678`

## Opción 2: Docker Compose

1. Levantar stack completo:
   ```bash
   docker compose up --build
   ```
2. Abrir:
   - `http://localhost:8086/index.html?mode=standalone`
   - `http://localhost:8086/index.html?mode=sap&documentType=CC&documentNumber=12345678`

## Base local y seed automático

- La base SQLite queda en `database/med_rda.sqlite`.
- El backend ejecuta seed automático al iniciar (5 pacientes, 4+ RDA por paciente).

## Endpoints simulados (flujo ministerio)

- `POST /api/query-patient`
- `POST /api/patient-rda`
- `POST /api/fhir-summary`
- `POST /api/composition-document`
- `GET /api/download-document`

## Punto de integración futura sandbox/FHIR

Reemplazar la capa de servicios en `backend/services/rda-service.js` manteniendo contratos actuales de endpoints.
