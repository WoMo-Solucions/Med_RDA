# Ejecución local rápida

## Opción 1: servidor estático (sin Docker)

1. Desde la raíz del proyecto, levantar un servidor estático:
   ```bash
   python3 -m http.server 4173
   ```
2. Abrir en navegador:
   - Standalone: `http://localhost:4173/index.html?mode=standalone`
   - SAP por query params: `http://localhost:4173/index.html?mode=sap&documentType=CC&documentNumber=1020304050`
3. SAP por contexto de ventana (ejemplo):
   ```html
   <script>
     window.SAP_CONTEXT = { documentType: 'CC', documentNumber: '1020304050' };
   </script>
   ```

## Opción 2: Docker Compose

1. Levantar contenedor con Nginx:
   ```bash
   docker compose up --build
   ```
2. Abrir en navegador:
   - Standalone: `http://localhost:8086/index.html?mode=standalone`
   - SAP por query params: `http://localhost:8086/index.html?mode=sap&documentType=CC&documentNumber=1020304050`

## Punto de integración backend real/FHIR

Reemplazar la implementación de `loadPatientRdas` en `assets/js/api.js` para llamar el backend/FHIR.
La interfaz esperada se mantiene:
- Entrada: `{ documentType, documentNumber }`
- Salida: `{ patient, rdas }`
