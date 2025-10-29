export enum LegalStatus {
  DeedDelivered = 'Escritura entregada',
  SignedDeedInProgress = 'Escritura firmada en tramite de RPP o Catastro',
  PendingSignature = 'Pendiente de Firma',
  NoPayment = 'No ha realizado pago de impuestos y derechos',
}

export enum FinancialStatus {
  ActiveCredit = 'Crédito Vigente',
  NoCredit = 'Sin Crédito',
  PaidOff = 'Pagado',
  Default = 'En Mora',
}

export enum StrategyStatus {
  NotStarted = 'No Iniciado',
  InProgress = 'En Progreso',
  Completed = 'Completado',
  OnHold = 'En Pausa',
  Rejected = 'Rechazado',
}

export enum StatusCarpetaATC {
  NotApplicable = 'No aplica',
  InProgress = 'En proceso',
  Delivered = 'Entregada',
}

export interface Task {
  id: string;
  description: string;
  dueDate: string; 
  assignedTo: string;
  isCompleted: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
}


export interface Abono {
  realizado: boolean;
  cantidad: number;
  fecha: string; // YYYY-MM-DD
  formaDePago: string;
  comprobante: string;
  validado: boolean;
}

export interface SolidarityTitlingLoanData {
  referencia: string;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
  expediente: string;
  montoPrestamo: number;
  firmoAdenda: boolean;
  modalidadAbono: string;
  abonos: Abono[];
}

export interface TailoredLegalSupportData {
  tramiteActual: string;
  estatusTramite: string;
  contactado: boolean;
  recibioFlyer: boolean;
  recibioAsesoria: boolean;
  fechaUltimoContacto: string; // YYYY-MM-DD
  fechaSeguimiento: string; // YYYY-MM-DD
  seguimientoRealizado: boolean;
  tramiteAnterior: string;
  siguienteTramite: string;
  responsable: string;
  observaciones: string;
  enviarRecordatorio: boolean;
}

export interface DirectPromotionFIData {
  contactado: boolean;
  citaInformacion: string; // YYYY-MM-DD
  recibioFlyer: boolean;
  recibioAsesoria: boolean;
  fechaUltimoContacto: string; // YYYY-MM-DD
  seguimiento: boolean;
  responsable: string;
  logroCredito: boolean;
  institucion: string;
  montoCredito: number;
  observaciones: string;
}


export interface CustomerStrategy {
  strategyId: string;
  accepted: boolean;
  status: StrategyStatus;
  lastUpdate: string;
  tasks: Task[];
  customData?: Record<string, any>;
}

export interface Customer {
  id: string;
  paternalLastName: string;
  maternalLastName: string;
  firstName: string;
  contact: string;
  lots: number;
  manzana: string;
  lote: string;
  legalStatus: LegalStatus;
  pathwayToTitling: number; // New field for progress towards construction
  financialStatus: FinancialStatus;
  motivation: string;
  group: string;
  financialProgress: number;
  lastUpdate: string; 
  strategies: CustomerStrategy[];
  potentialStrategies: string[];
  hasTituloPropiedad: boolean;
  hasDeslinde: boolean;
  hasPermisoConstruccion: boolean;
  modificacionLote: boolean;
  contratoATC: boolean;
  pagoATC: boolean;
  statusCarpetaATC: StatusCarpetaATC;
  recordatorioEntregaCarpeta: string; // YYYY-MM-DD
  responsable: string;
  startedConstruction: boolean;
}