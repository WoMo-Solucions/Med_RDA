const { run, get } = require('../db/database');

const DOCUMENT_TYPES = [
  ['CC', 'Cédula de ciudadanía'],
  ['CE', 'Cédula de extranjería'],
  ['TI', 'Tarjeta de identidad'],
  ['RC', 'Registro civil'],
  ['PA', 'Pasaporte'],
  ['AS', 'Adulto sin identificación'],
  ['MS', 'Menor sin identificación'],
  ['NU', 'Número único de identificación personal']
];

const INSTITUTIONS = [
  'Clínica Santa Aurora',
  'Hospital San Gabriel',
  'Centro Médico Horizonte',
  'IPS Integrada Norte',
  'Diagnóstico Avanzado IPS',
  'Fundación CardioVida',
  'Unidad Materno Infantil Sol',
  'Hospital Universitario Central'
];

const PATIENTS = [
  { name: 'María Fernanda Gómez Rojas', type: 'CC', number: '1020304050', sex: 'Femenino', birthDate: '1987-04-16', insurer: 'EPS Salud Integral' },
  { name: 'Carlos Alberto Rincón', type: 'CC', number: '800900100', sex: 'Masculino', birthDate: '1974-11-03', insurer: 'EPS Vida Plena' },
  { name: 'Ana Lucía Pardo', type: 'CC', number: '12345678', sex: 'Femenino', birthDate: '1990-02-21', insurer: 'Nueva EPS' },
  { name: 'José Miguel Torres', type: 'CE', number: 'X900123', sex: 'Masculino', birthDate: '1982-09-13', insurer: 'Sanitas' },
  { name: 'Laura Camila Duarte', type: 'TI', number: '10556677', sex: 'Femenino', birthDate: '2008-06-08', insurer: 'Sura' },
  { name: 'Sofía Andrea Molina', type: 'CC', number: '52347890', sex: 'Femenino', birthDate: '1996-01-30', insurer: 'Compensar' },
  { name: 'Ricardo Esteban León', type: 'CC', number: '91234567', sex: 'Masculino', birthDate: '1980-12-11', insurer: 'Famisanar' },
  { name: 'Valentina Serrano Ruiz', type: 'PA', number: 'PA778899', sex: 'Femenino', birthDate: '1993-05-19', insurer: 'Particular' }
];

const RDA_RECORDS = [
  {
    code: 'RDA-1001', patient: '1020304050', institution: 'Clínica Santa Aurora', date: '2025-01-15',
    type: 'Urgencias', service: 'Urgencias - Dra. Paula Sánchez', mainDx: 'J06.9 Infección respiratoria aguda',
    mainProcedure: 'Nebulización con broncodilatador', documentClass: 'Composición clínica',
    summary: 'Disnea leve y tos productiva, respuesta adecuada a manejo de urgencias.',
    diagnoses: [['J06.9', 'Infección respiratoria aguda'], ['R05', 'Tos']],
    procedures: [['99.10', 'Nebulización'], ['89.52', 'Oximetría de pulso']],
    medications: [['Salbutamol', '2 puff cada 6h por 3 días'], ['Acetaminofén', '500 mg cada 8h por 2 días']],
    observations: ['Alta con signos de alarma explicados.'],
    attachments: [['Epicrisis urgencias', 'RDA-1001-DOC', 'Documento clínico de urgencias']],
    timeline: [['08:10', 'Ingreso y triage'], ['08:45', 'Evaluación médica'], ['09:20', 'Alta de urgencias']]
  },
  {
    code: 'RDA-1002', patient: '1020304050', institution: 'Centro Médico Horizonte', date: '2025-02-12',
    type: 'Control médico', service: 'Medicina interna - Dr. Juan Salazar', mainDx: 'I10 Hipertensión arterial esencial',
    mainProcedure: 'Control de presión arterial', documentClass: 'Composición clínica',
    summary: 'Seguimiento de hipertensión con ajuste de dosis y plan nutricional.',
    diagnoses: [['I10', 'Hipertensión arterial esencial']],
    procedures: [['89.61', 'Control de signos vitales']],
    medications: [['Losartán 50 mg', '1 tableta cada 24h']],
    observations: ['Adherencia parcial al tratamiento.'],
    attachments: [],
    timeline: [['14:05', 'Ingreso a consulta'], ['14:30', 'Ajuste terapéutico']]
  },
  {
    code: 'RDA-1003', patient: '1020304050', institution: 'Hospital San Gabriel', date: '2025-03-04',
    type: 'Hospitalización', service: 'Cirugía general - Dr. Andrés Peña', mainDx: 'K81.0 Colecistitis aguda',
    mainProcedure: 'Colecistectomía laparoscópica', documentClass: 'Composición quirúrgica',
    summary: 'Hospitalización por dolor abdominal con manejo quirúrgico sin complicaciones.',
    diagnoses: [['K81.0', 'Colecistitis aguda'], ['R10.1', 'Dolor abdominal superior']],
    procedures: [['51.23', 'Colecistectomía laparoscópica'], ['89.07', 'Valoración preanestésica']],
    medications: [['Cefazolina', '1 g IV cada 8h'], ['Ketorolaco', '30 mg IV cada 8h']],
    observations: ['Egreso a las 48 horas con buena tolerancia oral.'],
    attachments: [['Reporte quirúrgico', 'RDA-1003-DOC', 'Informe operatorio y hallazgos']],
    timeline: [['06:40', 'Ingreso hospitalario'], ['10:15', 'Inicio cirugía'], ['12:00', 'Traslado recuperación'], ['18:30', 'Control posquirúrgico']]
  },
  { code: 'RDA-1004', patient: '1020304050', institution: 'Diagnóstico Avanzado IPS', date: '2025-04-18', type: 'Apoyo diagnóstico', service: 'Radiología - Dra. Lina Muñoz', mainDx: 'Z09 Seguimiento postoperatorio', mainProcedure: 'Ecografía abdominal total', documentClass: 'Informe diagnóstico', summary: 'Control imagenológico posquirúrgico sin hallazgos de alarma.', diagnoses: [['Z09', 'Control postoperatorio']], procedures: [['88.76', 'Ecografía abdominal']], medications: [], observations: ['Sin colecciones ni signos de infección.'], attachments: [['Informe imagenológico', 'RDA-1004-DOC', 'Resultado de ecografía abdominal']], timeline: [['09:00', 'Recepción de orden'], ['09:45', 'Toma de ecografía'], ['10:30', 'Entrega de informe']] },
  { code: 'RDA-1005', patient: '1020304050', institution: 'Fundación CardioVida', date: '2025-05-10', type: 'Procedimiento ambulatorio', service: 'Cardiología - Dr. Felipe Rojas', mainDx: 'I49.9 Arritmia no especificada', mainProcedure: 'Holter 24 horas', documentClass: 'Composición ambulatoria', summary: 'Evaluación ambulatoria por palpitaciones de esfuerzo.', diagnoses: [['I49.9', 'Arritmia no especificada']], procedures: [['89.41', 'Registro Holter']], medications: [], observations: ['Pendiente lectura por cardiología.'], attachments: [], timeline: [['07:50', 'Instalación Holter'], ['08:15', 'Entrega recomendaciones']] },
  { code: 'RDA-1006', patient: '1020304050', institution: 'Centro Médico Horizonte', date: '2025-06-21', type: 'Consulta externa', service: 'Gastroenterología - Dra. Sonia Pérez', mainDx: 'K21.9 Reflujo gastroesofágico', mainProcedure: 'Consulta especializada', documentClass: 'Composición clínica', summary: 'Control por epigastralgia posterior a cirugía de vesícula.', diagnoses: [['K21.9', 'ERGE'], ['R12', 'Pirosis']], procedures: [['89.39', 'Evaluación médica integral']], medications: [['Esomeprazol 40 mg', '1 cápsula diaria por 30 días']], observations: [], attachments: [], timeline: [['11:05', 'Ingreso'], ['11:40', 'Formulación y egreso']] },

  { code: 'RDA-2001', patient: '800900100', institution: 'IPS Integrada Norte', date: '2025-01-10', type: 'Consulta externa', service: 'Medicina familiar - Dr. Pedro Nieto', mainDx: 'E11.9 Diabetes mellitus tipo 2', mainProcedure: 'Consulta control crónico', documentClass: 'Composición clínica', summary: 'Control metabólico semestral con HbA1c fuera de meta.', diagnoses: [['E11.9', 'DM2 sin complicaciones']], procedures: [['90.59', 'Solicitud HbA1c']], medications: [['Metformina 850 mg', '1 tableta cada 12h']], observations: ['Se inicia plan de educación diabetológica.'], attachments: [], timeline: [['15:00', 'Control en consulta']] },
  { code: 'RDA-2002', patient: '800900100', institution: 'Clínica Santa Aurora', date: '2025-02-03', type: 'Urgencias', service: 'Urgencias adultos', mainDx: 'N39.0 Infección urinaria', mainProcedure: 'Uroanálisis y manejo antibiótico', documentClass: 'Composición clínica', summary: 'Disuria y fiebre, manejo antibiótico oral.', diagnoses: [['N39.0', 'ITU no complicada']], procedures: [['90.31', 'Uroanálisis']], medications: [['Nitrofurantoína', '100 mg cada 12h por 5 días']], observations: [], attachments: [['Orden de laboratorio', 'RDA-2002-DOC', 'Soporte de uroanálisis']], timeline: [['19:20', 'Ingreso'], ['20:10', 'Egreso']] },
  { code: 'RDA-2003', patient: '800900100', institution: 'Hospital San Gabriel', date: '2025-02-22', type: 'Hospitalización', service: 'Medicina interna', mainDx: 'J18.9 Neumonía adquirida en la comunidad', mainProcedure: 'Manejo intrahospitalario', documentClass: 'Composición clínica', summary: 'Ingreso por neumonía con requerimiento de oxígeno suplementario.', diagnoses: [['J18.9', 'Neumonía no especificada']], procedures: [['93.90', 'Oxigenoterapia']], medications: [['Ceftriaxona', '1 g IV cada 24h']], observations: ['Estancia de 3 días, evolución favorable.'], attachments: [['Epicrisis de egreso', 'RDA-2003-DOC', 'Resumen de hospitalización']], timeline: [['06:15', 'Ingreso'], ['09:00', 'Inicio antibiótico'], ['18:00', 'Control clínico'], ['08:30', 'Egreso día 3']] },
  { code: 'RDA-2004', patient: '800900100', institution: 'Diagnóstico Avanzado IPS', date: '2025-03-11', type: 'Apoyo diagnóstico', service: 'Imágenes diagnósticas', mainDx: 'R05 Tos persistente', mainProcedure: 'Radiografía de tórax', documentClass: 'Informe diagnóstico', summary: 'Control radiográfico posterior a neumonía.', diagnoses: [['R05', 'Tos']], procedures: [['87.44', 'Rayos X de tórax']], medications: [], observations: ['Mejoría radiológica.'], attachments: [['Placa digital', 'RDA-2004-DOC', 'Referencia imagen PACS']], timeline: [['10:00', 'Toma imagen'], ['11:00', 'Lectura radiológica']] },
  { code: 'RDA-2005', patient: '800900100', institution: 'Fundación CardioVida', date: '2025-05-02', type: 'Control médico', service: 'Cardiología', mainDx: 'I25.1 Enfermedad coronaria crónica', mainProcedure: 'Electrocardiograma', documentClass: 'Composición clínica', summary: 'Seguimiento cardiológico con control de riesgo cardiovascular.', diagnoses: [['I25.1', 'Enfermedad coronaria crónica'], ['E78.5', 'Dislipidemia']], procedures: [['89.52', 'Electrocardiograma']], medications: [['Atorvastatina 40 mg', '1 tableta nocturna'], ['ASA 100 mg', '1 tableta diaria']], observations: [], attachments: [], timeline: [['08:50', 'Control cardiología'], ['09:15', 'EKG']] },

  { code: 'RDA-3001', patient: '12345678', institution: 'Centro Médico Horizonte', date: '2025-01-30', type: 'Consulta externa', service: 'Ginecología', mainDx: 'N92.0 Menstruación excesiva', mainProcedure: 'Consulta especializada', documentClass: 'Composición clínica', summary: 'Valoración de sangrado uterino disfuncional.', diagnoses: [['N92.0', 'Menstruación excesiva']], procedures: [['89.39', 'Examen clínico']], medications: [['Ácido tranexámico', '500 mg cada 8h por 3 días']], observations: ['Solicita ecografía transvaginal.'], attachments: [], timeline: [['09:40', 'Ingreso consulta']] },
  { code: 'RDA-3002', patient: '12345678', institution: 'Clínica Santa Aurora', date: '2025-03-05', type: 'Urgencias', service: 'Urgencias adultos', mainDx: 'G43.9 Migraña', mainProcedure: 'Manejo sintomático IV', documentClass: 'Composición clínica', summary: 'Cefalea intensa con náuseas, respuesta favorable a analgésicos.', diagnoses: [['G43.9', 'Migraña no especificada']], procedures: [['99.29', 'Administración IV']], medications: [['Dipirona', '2 g IV dosis única']], observations: [], attachments: [], timeline: [['21:10', 'Ingreso'], ['22:05', 'Egreso']] },
  { code: 'RDA-3003', patient: '12345678', institution: 'Diagnóstico Avanzado IPS', date: '2025-03-14', type: 'Apoyo diagnóstico', service: 'Ecografía', mainDx: 'N83.2 Quiste ovárico funcional', mainProcedure: 'Ecografía transvaginal', documentClass: 'Informe diagnóstico', summary: 'Lesión quística simple de 2.5 cm en ovario derecho.', diagnoses: [['N83.2', 'Quiste ovárico funcional']], procedures: [['88.78', 'Ecografía pélvica transvaginal']], medications: [], observations: ['Control en 3 meses.'], attachments: [['Informe ecográfico', 'RDA-3003-DOC', 'Resultado ecografía transvaginal']], timeline: [['08:00', 'Ingreso estudios'], ['08:40', 'Lectura']] },
  { code: 'RDA-3004', patient: '12345678', institution: 'Hospital San Gabriel', date: '2025-04-07', type: 'Hospitalización', service: 'Ginecología hospitalaria', mainDx: 'D25.9 Leiomioma uterino', mainProcedure: 'Manejo intrahospitalario', documentClass: 'Composición clínica', summary: 'Hospitalización corta por anemia secundaria a sangrado uterino.', diagnoses: [['D25.9', 'Leiomioma uterino'], ['D64.9', 'Anemia no especificada']], procedures: [['99.04', 'Transfusión de componentes sanguíneos']], medications: [['Hierro sacarato', 'Dosis hospitalaria']], observations: ['Egreso estable con control ambulatorio.'], attachments: [['Epicrisis hospitalaria', 'RDA-3004-DOC', 'Resumen estancia']], timeline: [['07:20', 'Ingreso'], ['10:30', 'Interconsulta'], ['16:00', 'Transfusión'], ['09:00', 'Egreso']] },
  { code: 'RDA-3005', patient: '12345678', institution: 'Unidad Materno Infantil Sol', date: '2025-06-03', type: 'Control médico', service: 'Planificación familiar', mainDx: 'Z30.0 Consejo anticonceptivo', mainProcedure: 'Implante subdérmico', documentClass: 'Composición de procedimiento', summary: 'Asesoría y procedimiento de anticoncepción de larga duración.', diagnoses: [['Z30.0', 'Consejería anticonceptiva']], procedures: [['69.7', 'Inserción de implante subdérmico']], medications: [['Lidocaína', 'Anestesia local']], observations: ['Sin complicaciones inmediatas.'], attachments: [['Consentimiento informado', 'RDA-3005-DOC', 'Consentimiento firmado']], timeline: [['13:00', 'Consejería'], ['13:40', 'Procedimiento'], ['14:10', 'Observación posprocedimiento']] },

  { code: 'RDA-4001', patient: 'X900123', institution: 'IPS Integrada Norte', date: '2025-01-18', type: 'Consulta externa', service: 'Ortopedia', mainDx: 'M54.5 Lumbalgia', mainProcedure: 'Consulta especializada', documentClass: 'Composición clínica', summary: 'Dolor lumbar mecánico sin signos de alarma neurológica.', diagnoses: [['M54.5', 'Lumbalgia']], procedures: [['93.05', 'Remisión a fisioterapia']], medications: [['Naproxeno 500 mg', 'Cada 12h por 5 días']], observations: [], attachments: [], timeline: [['10:10', 'Evaluación inicial']] },
  { code: 'RDA-4002', patient: 'X900123', institution: 'Clínica Santa Aurora', date: '2025-02-28', type: 'Urgencias', service: 'Urgencias', mainDx: 'S93.4 Esguince de tobillo', mainProcedure: 'Inmovilización y analgesia', documentClass: 'Composición clínica', summary: 'Trauma deportivo con esguince grado I.', diagnoses: [['S93.4', 'Esguince de tobillo']], procedures: [['93.54', 'Vendaje funcional']], medications: [['Ibuprofeno', '400 mg cada 8h']], observations: ['Reposo relativo por 72h.'], attachments: [], timeline: [['18:30', 'Ingreso'], ['19:20', 'Alta']] },
  { code: 'RDA-4003', patient: 'X900123', institution: 'Hospital San Gabriel', date: '2025-03-30', type: 'Hospitalización', service: 'Traumatología', mainDx: 'S82.2 Fractura de tibia', mainProcedure: 'Reducción cerrada y yeso', documentClass: 'Composición quirúrgica', summary: 'Paciente hospitalizado por fractura cerrada de tibia distal.', diagnoses: [['S82.2', 'Fractura de tibia']], procedures: [['79.06', 'Reducción cerrada de fractura'], ['93.53', 'Colocación de yeso']], medications: [['Tramadol', '50 mg cada 12h']], observations: ['Control por ortopedia en 2 semanas.'], attachments: [['Reporte de imágenes', 'RDA-4003-DOC', 'Radiografías de tibia']], timeline: [['05:40', 'Ingreso'], ['07:00', 'Procedimiento'], ['08:45', 'Control postprocedimiento']] },
  { code: 'RDA-4004', patient: 'X900123', institution: 'Diagnóstico Avanzado IPS', date: '2025-04-10', type: 'Apoyo diagnóstico', service: 'Radiología', mainDx: 'Z47.8 Control de fractura', mainProcedure: 'Rayos X de control', documentClass: 'Informe diagnóstico', summary: 'Adecuada alineación posterior a inmovilización.', diagnoses: [['Z47.8', 'Seguimiento ortopédico']], procedures: [['87.35', 'Radiografía pierna']], medications: [], observations: [], attachments: [['Control radiográfico', 'RDA-4004-DOC', 'Lectura imagen control']], timeline: [['11:20', 'Ingreso'], ['11:55', 'Informe']] },

  { code: 'RDA-5001', patient: '10556677', institution: 'IPS Integrada Norte', date: '2025-01-14', type: 'Control médico', service: 'Pediatría', mainDx: 'J45.9 Asma infantil', mainProcedure: 'Control de crecimiento y asma', documentClass: 'Composición clínica', summary: 'Control pediátrico con educación de técnica inhalatoria.', diagnoses: [['J45.9', 'Asma no especificada']], procedures: [['89.01', 'Evaluación crecimiento y desarrollo']], medications: [['Budesonida inhalada', '1 inhalación cada 12h']], observations: ['Buen apego al tratamiento.'], attachments: [], timeline: [['16:00', 'Control pediátrico']] },
  { code: 'RDA-5002', patient: '10556677', institution: 'Clínica Santa Aurora', date: '2025-02-08', type: 'Urgencias', service: 'Urgencias pediátricas', mainDx: 'J20.9 Bronquitis aguda', mainProcedure: 'Nebulización', documentClass: 'Composición clínica', summary: 'Exacerbación respiratoria leve sin hipoxemia.', diagnoses: [['J20.9', 'Bronquitis aguda']], procedures: [['99.10', 'Nebulización']], medications: [['Salbutamol inhalado', '1 inhalación cada 6h']], observations: [], attachments: [], timeline: [['22:10', 'Ingreso'], ['22:45', 'Revaloración'], ['23:10', 'Alta']] },
  { code: 'RDA-5003', patient: '10556677', institution: 'Centro Médico Horizonte', date: '2025-03-17', type: 'Consulta externa', service: 'Pediatría', mainDx: 'Z00.1 Examen de rutina', mainProcedure: 'Control anual', documentClass: 'Composición clínica', summary: 'Consulta de rutina sin hallazgos patológicos.', diagnoses: [['Z00.1', 'Control pediátrico']], procedures: [['89.01', 'Examen físico general']], medications: [], observations: ['Vacunación al día.'], attachments: [], timeline: [['09:00', 'Ingreso y valoración']] },
  { code: 'RDA-5004', patient: '10556677', institution: 'Diagnóstico Avanzado IPS', date: '2025-04-21', type: 'Apoyo diagnóstico', service: 'Laboratorio clínico', mainDx: 'Z13.0 Tamizaje anemia', mainProcedure: 'Cuadro hemático', documentClass: 'Informe diagnóstico', summary: 'Tamizaje de anemia con parámetros dentro de rango.', diagnoses: [['Z13.0', 'Tamizaje hematológico']], procedures: [['90.59', 'Cuadro hemático']], medications: [], observations: [], attachments: [['Resultado laboratorio', 'RDA-5004-DOC', 'Resultados hemograma']], timeline: [['07:30', 'Toma muestra'], ['10:00', 'Liberación resultado']] },

  { code: 'RDA-6001', patient: '52347890', institution: 'Unidad Materno Infantil Sol', date: '2025-01-25', type: 'Consulta externa', service: 'Control prenatal', mainDx: 'Z34.9 Supervisión embarazo normal', mainProcedure: 'Consulta prenatal', documentClass: 'Composición clínica', summary: 'Gestante de 24 semanas, control prenatal sin alarmas.', diagnoses: [['Z34.9', 'Supervisión de embarazo normal']], procedures: [['88.78', 'Ecografía obstétrica']], medications: [['Sulfato ferroso', '1 tableta diaria'], ['Ácido fólico', '1 tableta diaria']], observations: ['Se recomienda curso psicoprofiláctico.'], attachments: [['Control prenatal', 'RDA-6001-DOC', 'Formato control prenatal']], timeline: [['08:00', 'Ingreso'], ['08:50', 'Ecografía'], ['09:10', 'Educación prenatal']] },
  { code: 'RDA-6002', patient: '52347890', institution: 'Diagnóstico Avanzado IPS', date: '2025-02-26', type: 'Apoyo diagnóstico', service: 'Laboratorio prenatal', mainDx: 'Z36.8 Tamizaje prenatal', mainProcedure: 'Perfil infeccioso', documentClass: 'Informe diagnóstico', summary: 'Tamizaje infeccioso prenatal sin alteraciones.', diagnoses: [['Z36.8', 'Tamizaje prenatal']], procedures: [['90.59', 'Perfil serológico']], medications: [], observations: [], attachments: [['Resultados serología', 'RDA-6002-DOC', 'Resultados prenatales']], timeline: [['06:40', 'Toma muestra'], ['12:20', 'Resultados publicados']] },
  { code: 'RDA-6003', patient: '52347890', institution: 'Hospital Universitario Central', date: '2025-04-11', type: 'Hospitalización', service: 'Ginecoobstetricia', mainDx: 'O60.0 Amenaza de parto pretérmino', mainProcedure: 'Manejo hospitalario tocolítico', documentClass: 'Composición clínica', summary: 'Hospitalización breve por dinámica uterina pretérmino.', diagnoses: [['O60.0', 'Amenaza de parto pretérmino']], procedures: [['75.34', 'Monitoreo fetal']], medications: [['Nifedipino', '10 mg cada 8h']], observations: ['Control ambulatorio estricto.'], attachments: [['Epicrisis obstétrica', 'RDA-6003-DOC', 'Resumen de hospitalización obstétrica']], timeline: [['02:30', 'Ingreso por urgencias'], ['03:00', 'Monitoreo fetal'], ['08:00', 'Revaloración']]
  },
  { code: 'RDA-6004', patient: '52347890', institution: 'Unidad Materno Infantil Sol', date: '2025-05-30', type: 'Control médico', service: 'Control prenatal de alto riesgo', mainDx: 'O09.9 Embarazo de alto riesgo', mainProcedure: 'Seguimiento ecográfico', documentClass: 'Composición clínica', summary: 'Seguimiento de embarazo con antecedente de amenaza de parto pretérmino.', diagnoses: [['O09.9', 'Embarazo de alto riesgo']], procedures: [['88.78', 'Ecografía obstétrica de control']], medications: [['Progesterona', '200 mg nocturna']], observations: [], attachments: [], timeline: [['09:10', 'Consulta de control']] },

  { code: 'RDA-7001', patient: '91234567', institution: 'Fundación CardioVida', date: '2025-01-09', type: 'Consulta externa', service: 'Cardiología', mainDx: 'I20.9 Angina de pecho', mainProcedure: 'Consulta y estratificación de riesgo', documentClass: 'Composición clínica', summary: 'Dolor torácico de esfuerzo con plan de estudios complementarios.', diagnoses: [['I20.9', 'Angina de pecho']], procedures: [['89.52', 'Electrocardiograma']], medications: [['Metoprolol 50 mg', '1 tableta cada 12h']], observations: ['Solicita prueba de esfuerzo.'], attachments: [], timeline: [['07:40', 'Ingreso consulta'], ['08:20', 'Plan diagnóstico']] },
  { code: 'RDA-7002', patient: '91234567', institution: 'Hospital Universitario Central', date: '2025-02-18', type: 'Procedimiento ambulatorio', service: 'Hemodinamia', mainDx: 'I25.1 Enfermedad coronaria', mainProcedure: 'Cateterismo diagnóstico', documentClass: 'Composición de procedimiento', summary: 'Cateterismo sin complicaciones, lesiones no críticas.', diagnoses: [['I25.1', 'Enfermedad coronaria crónica']], procedures: [['37.22', 'Cateterismo cardíaco']], medications: [['Heparina', 'Dosis intraprocedimiento']], observations: ['Observación 6 horas postprocedimiento.'], attachments: [['Reporte hemodinamia', 'RDA-7002-DOC', 'Informe del cateterismo']], timeline: [['10:00', 'Ingreso unidad'], ['10:40', 'Inicio procedimiento'], ['12:00', 'Recuperación']] },
  { code: 'RDA-7003', patient: '91234567', institution: 'Hospital Universitario Central', date: '2025-02-21', type: 'Hospitalización', service: 'Unidad coronaria', mainDx: 'I21.4 Infarto subendocárdico', mainProcedure: 'Manejo unidad coronaria', documentClass: 'Composición clínica', summary: 'Ingreso por síndrome coronario agudo, manejo médico intensivo.', diagnoses: [['I21.4', 'Infarto subendocárdico'], ['I10', 'Hipertensión arterial']], procedures: [['99.19', 'Infusión medicamentosa continua'], ['89.52', 'Monitoreo electrocardiográfico']], medications: [['Clopidogrel', '75 mg diarios'], ['Enoxaparina', '60 mg cada 12h']], observations: ['Egreso con rehabilitación cardíaca programada.'], attachments: [['Epicrisis coronaria', 'RDA-7003-DOC', 'Resumen UCI coronaria']], timeline: [['01:40', 'Ingreso urgencias'], ['02:00', 'Traslado unidad coronaria'], ['08:00', 'Ronda médica'], ['14:00', 'Ajuste terapéutico']] },
  { code: 'RDA-7004', patient: '91234567', institution: 'Diagnóstico Avanzado IPS', date: '2025-03-08', type: 'Apoyo diagnóstico', service: 'Cardiología no invasiva', mainDx: 'I25.1 Enfermedad coronaria', mainProcedure: 'Ecocardiograma transtorácico', documentClass: 'Informe diagnóstico', summary: 'Fracción de eyección conservada.', diagnoses: [['I25.1', 'Enfermedad coronaria']], procedures: [['88.72', 'Ecocardiograma transtorácico']], medications: [], observations: [], attachments: [['Informe ecocardiograma', 'RDA-7004-DOC', 'Resultado eco']], timeline: [['08:20', 'Ingreso'], ['09:00', 'Informe']] },

  { code: 'RDA-8001', patient: 'PA778899', institution: 'Centro Médico Horizonte', date: '2025-01-19', type: 'Consulta externa', service: 'Dermatología', mainDx: 'L20.9 Dermatitis atópica', mainProcedure: 'Consulta especializada', documentClass: 'Composición clínica', summary: 'Dermatitis en flexuras con brote leve.', diagnoses: [['L20.9', 'Dermatitis atópica']], procedures: [['89.39', 'Consulta especializada']], medications: [['Hidrocortisona tópica', 'Aplicar cada 12h por 7 días']], observations: [], attachments: [], timeline: [['13:10', 'Ingreso']] },
  { code: 'RDA-8002', patient: 'PA778899', institution: 'Clínica Santa Aurora', date: '2025-02-16', type: 'Urgencias', service: 'Urgencias adultos', mainDx: 'T78.4 Alergia no especificada', mainProcedure: 'Manejo antihistamínico', documentClass: 'Composición clínica', summary: 'Urticaria generalizada posterior a ingesta alimentaria.', diagnoses: [['T78.4', 'Alergia no especificada']], procedures: [['99.29', 'Administración parenteral']], medications: [['Clorfeniramina', '10 mg IM dosis única']], observations: ['Mejoría clínica en observación.'], attachments: [], timeline: [['20:30', 'Ingreso'], ['21:20', 'Alta']] },
  { code: 'RDA-8003', patient: 'PA778899', institution: 'Diagnóstico Avanzado IPS', date: '2025-03-25', type: 'Apoyo diagnóstico', service: 'Laboratorio', mainDx: 'Z13.8 Tamizaje alergias', mainProcedure: 'Panel IgE específico', documentClass: 'Informe diagnóstico', summary: 'Panel alérgenos con positividad para ácaros.', diagnoses: [['Z13.8', 'Tamizaje de alergias']], procedures: [['90.59', 'Panel inmunológico']], medications: [], observations: ['Remisión a alergología.'], attachments: [['Panel inmunológico', 'RDA-8003-DOC', 'Resultado panel IgE']], timeline: [['07:10', 'Muestra'], ['15:30', 'Resultado']] },
  { code: 'RDA-8004', patient: 'PA778899', institution: 'Centro Médico Horizonte', date: '2025-04-28', type: 'Control médico', service: 'Alergología', mainDx: 'J30.4 Rinitis alérgica', mainProcedure: 'Control clínico', documentClass: 'Composición clínica', summary: 'Inicia manejo de rinitis alérgica persistente.', diagnoses: [['J30.4', 'Rinitis alérgica']], procedures: [['89.39', 'Seguimiento especializado']], medications: [['Loratadina', '10 mg diarios']], observations: [], attachments: [], timeline: [['09:50', 'Consulta de control']] }
];

async function createSchema(db) {
  await run(db, 'PRAGMA foreign_keys = ON');
  await run(db, `CREATE TABLE IF NOT EXISTS document_types (code TEXT PRIMARY KEY, label TEXT NOT NULL)`);
  await run(db, `CREATE TABLE IF NOT EXISTS institutions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, document_type TEXT NOT NULL, document_number TEXT NOT NULL, sex TEXT, birth_date TEXT, insurer TEXT, UNIQUE(document_type, document_number), FOREIGN KEY(document_type) REFERENCES document_types(code))`);
  await run(db, `CREATE TABLE IF NOT EXISTS rda_records (id INTEGER PRIMARY KEY AUTOINCREMENT, record_code TEXT NOT NULL UNIQUE, patient_id INTEGER NOT NULL, institution_id INTEGER, attention_date TEXT NOT NULL, rda_type TEXT NOT NULL, service_professional TEXT, main_diagnosis TEXT, main_procedure TEXT, document_class TEXT, clinical_summary TEXT, FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE, FOREIGN KEY(institution_id) REFERENCES institutions(id))`);
  await run(db, `CREATE TABLE IF NOT EXISTS diagnoses (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, code TEXT, description TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS procedures (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, code TEXT, description TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS medications (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, name TEXT, dosage TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, note TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, name TEXT, reference TEXT, content TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS timeline_events (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, event_time TEXT, event_text TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS composition_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL UNIQUE, profile TEXT, status TEXT, notes TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
}

async function resetDatabase(db) {
  await createSchema(db);
  await run(db, 'DELETE FROM composition_documents');
  await run(db, 'DELETE FROM timeline_events');
  await run(db, 'DELETE FROM attachments');
  await run(db, 'DELETE FROM observations');
  await run(db, 'DELETE FROM medications');
  await run(db, 'DELETE FROM procedures');
  await run(db, 'DELETE FROM diagnoses');
  await run(db, 'DELETE FROM rda_records');
  await run(db, 'DELETE FROM patients');
  await run(db, 'DELETE FROM institutions');
  await run(db, 'DELETE FROM document_types');
}

async function seedDatabase(db) {
  await createSchema(db);

  for (const [code, label] of DOCUMENT_TYPES) {
    await run(db, 'INSERT OR REPLACE INTO document_types (code, label) VALUES (?, ?)', [code, label]);
  }

  for (const name of INSTITUTIONS) {
    await run(db, 'INSERT OR IGNORE INTO institutions (name) VALUES (?)', [name]);
  }

  for (const patient of PATIENTS) {
    await run(
      db,
      `INSERT OR REPLACE INTO patients (id, full_name, document_type, document_number, sex, birth_date, insurer)
       VALUES ((SELECT id FROM patients WHERE document_type = ? AND document_number = ?), ?, ?, ?, ?, ?, ?)`,
      [patient.type, patient.number, patient.name, patient.type, patient.number, patient.sex, patient.birthDate, patient.insurer]
    );
  }

  const patientRows = await new Promise((resolve, reject) => db.all('SELECT id, document_number FROM patients', [], (e, r) => (e ? reject(e) : resolve(r))));
  const institutionRows = await new Promise((resolve, reject) => db.all('SELECT id, name FROM institutions', [], (e, r) => (e ? reject(e) : resolve(r))));
  const patientMap = Object.fromEntries(patientRows.map((r) => [r.document_number, r.id]));
  const institutionMap = Object.fromEntries(institutionRows.map((r) => [r.name, r.id]));

  for (const row of RDA_RECORDS) {
    await run(
      db,
      `INSERT OR REPLACE INTO rda_records
       (id, record_code, patient_id, institution_id, attention_date, rda_type, service_professional, main_diagnosis, main_procedure, document_class, clinical_summary)
       VALUES ((SELECT id FROM rda_records WHERE record_code = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.code,
        row.code,
        patientMap[row.patient],
        institutionMap[row.institution] || null,
        row.date,
        row.type,
        row.service,
        row.mainDx,
        row.mainProcedure,
        row.documentClass,
        row.summary
      ]
    );
  }

  const records = await new Promise((resolve, reject) => db.all('SELECT id, record_code FROM rda_records', [], (e, r) => (e ? reject(e) : resolve(r))));
  const idByCode = Object.fromEntries(records.map((r) => [r.record_code, r.id]));

  await run(db, 'DELETE FROM composition_documents');
  await run(db, 'DELETE FROM timeline_events');
  await run(db, 'DELETE FROM attachments');
  await run(db, 'DELETE FROM observations');
  await run(db, 'DELETE FROM medications');
  await run(db, 'DELETE FROM procedures');
  await run(db, 'DELETE FROM diagnoses');

  for (const row of RDA_RECORDS) {
    const recordId = idByCode[row.code];
    for (const diagnosis of row.diagnoses || []) {
      await run(db, 'INSERT INTO diagnoses (record_id, code, description) VALUES (?, ?, ?)', [recordId, diagnosis[0], diagnosis[1]]);
    }
    for (const procedure of row.procedures || []) {
      await run(db, 'INSERT INTO procedures (record_id, code, description) VALUES (?, ?, ?)', [recordId, procedure[0], procedure[1]]);
    }
    for (const medication of row.medications || []) {
      await run(db, 'INSERT INTO medications (record_id, name, dosage) VALUES (?, ?, ?)', [recordId, medication[0], medication[1]]);
    }
    for (const observation of row.observations || []) {
      await run(db, 'INSERT INTO observations (record_id, note) VALUES (?, ?)', [recordId, observation]);
    }
    for (const attachment of row.attachments || []) {
      await run(db, 'INSERT INTO attachments (record_id, name, reference, content) VALUES (?, ?, ?, ?)', [recordId, attachment[0], attachment[1], attachment[2]]);
    }
    for (const event of row.timeline || []) {
      await run(db, 'INSERT INTO timeline_events (record_id, event_time, event_text) VALUES (?, ?, ?)', [recordId, event[0], event[1]]);
    }

    await run(db, 'INSERT INTO composition_documents (record_id, profile, status, notes) VALUES (?, ?, ?, ?)', [
      recordId,
      `RDA-${row.type}`,
      'final',
      `Documento de composición generado para ${row.code}`
    ]);
  }
}

async function ensureSeeded(db) {
  await createSchema(db);
  const count = await get(db, 'SELECT COUNT(*) AS total FROM patients');
  if (!count || Number(count.total) === 0) {
    await seedDatabase(db);
  }
}

module.exports = {
  createSchema,
  seedDatabase,
  resetDatabase,
  ensureSeeded,
  DOCUMENT_TYPES,
  PATIENTS,
  RDA_RECORDS
};
