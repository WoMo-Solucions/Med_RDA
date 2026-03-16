# Datos de prueba Med_RDA (SQLite local)

> Catálogo de tipos de documento editable en: `backend/seeds/seed.js` (`DOCUMENT_TYPES`).

## Pacientes de demo recomendados

| Tipo | Documento | Paciente | # RDA | Escenario principal |
|---|---|---|---:|---|
| CC | 1020304050 | María Fernanda Gómez Rojas | 6 | Urgencias + hospitalización + procedimiento ambulatorio |
| CC | 800900100 | Carlos Alberto Rincón | 5 | Crónico + urgencias + hospitalización + cardiología |
| CC | 12345678 | Ana Lucía Pardo | 5 | Ginecología + urgencias + hospitalización + procedimiento |
| CE | X900123 | José Miguel Torres | 4 | Trauma/ortopedia + hospitalización |
| TI | 10556677 | Laura Camila Duarte | 4 | Pediatría + urgencias + laboratorio |
| CC | 52347890 | Sofía Andrea Molina | 4 | Prenatal + hospitalización obstétrica |
| CC | 91234567 | Ricardo Esteban León | 4 | Cardiología + hemodinamia + unidad coronaria |
| PA | PA778899 | Valentina Serrano Ruiz | 4 | Dermatología + alergología |

## Escenarios para pruebas rápidas

- **Urgencias**: `CC 1020304050`, `CC 800900100`, `CC 12345678`, `CE X900123`, `TI 10556677`, `PA PA778899`
- **Hospitalización**: `CC 1020304050`, `CC 800900100`, `CC 12345678`, `CE X900123`, `CC 52347890`, `CC 91234567`
- **Con anexos/documentos**: `CC 1020304050`, `CC 800900100`, `CC 12345678`, `CE X900123`, `CC 52347890`, `CC 91234567`, `PA PA778899`
- **Múltiples diagnósticos/procedimientos**: `CC 1020304050` (RDA-1003), `CC 12345678` (RDA-3004), `CC 91234567` (RDA-7003)

## Operación BD

- Inicializar esquema: `npm run db:init` (desde `backend/`)
- Sembrar datos: `npm run db:seed`
- Reset + reseed: `npm run db:reset`
