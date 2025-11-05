import type { Strategy } from './types';

export const RESPONSABLES = [
  "miriam.rivera@newstoryhomes.org",
  "francisco.hernandez@newstoryhomes.org",
  "tanya.tovar@newstoryhomes.org",
];

export const STRATEGIES: Strategy[] = [
  { id: 'STL', name: 'Fondo Solidario para la Titulación', description: 'Préstamo financiero para apoyar en la consecución de un títu.' },
  { id: 'TLS', name: 'Titulación a la medida', description: 'Asistencia legal personalizada para las necesidades del cliente.' },
  { id: 'DI', name: 'Intermediación de deuda de NS con cajas', description: 'Asistencia en la negociación y gestión de deudas existentes.' },
  { id: 'DPFI', name: 'Promoción directa con cajas', description: 'Promoción y conexión directa con Instituciones Financieras.' },
  { id: 'TAI', name: 'Devolución de asistencia técnica', description: 'Provee asesoría técnica de construcción junto con incentivos financieros.' },
  { id: 'BC', name: 'Catálogo de albañiles y empresas constructoras', description: 'Acceso a un catálogo de albañiles y contratistas verificados.' },
  { id: 'CC', name: 'Clusters de construcción', description: 'Participación en grupos de construcción para optimizar recursos.' },
];


export const STRATEGY_SPECIFIC_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'number' | 'date' }[]> = {
  'DI': [
    { key: 'fiName', label: 'Institución Financiera', type: 'text' },
    { key: 'debtAmount', label: 'Monto de la Deuda ($)', type: 'number' },
  ],
  'BC': [
    { key: 'selectedBuilder', label: 'Constructor Seleccionado', type: 'text' },
  ],
  'CC': [
      { key: 'clusterName', label: 'Nombre del Cluster', type: 'text' },
  ]
};

export const LEGAL_PROCEDURES = ["Título de propiedad", "Deslinde", "Permiso de construcción"];
export const LEGAL_STATUS_OPTIONS: ('No iniciado' | 'Siendo asesorado' | 'Completado')[] = ["No iniciado", "Siendo asesorado", "Completado"];
export const LEGAL_SUBSTATUS_OPTIONS: ('Pendiente de entrega de documentación' | 'Documento en presidencia municipal')[] = ["Pendiente de entrega de documentación", "Documento en presidencia municipal"];


export const LOAN_AMOUNT = 5500;
export const NUM_PAYMENTS = 6;

export const PRODUCTO_INTERES_DPFI = [
    'José Ma. Mercado',
    'CAPOME',
    'Fray Juan Calero',
    'Cristobal Colón',
    'INFONAVIT',
    'Ninguna de las anteriores',
];