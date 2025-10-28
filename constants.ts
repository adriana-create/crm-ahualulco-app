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

export const LOAN_AMOUNT = 5500;
export const NUM_PAYMENTS = 6;