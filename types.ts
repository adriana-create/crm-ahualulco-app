export enum LegalStatus {
  DeedDelivered = 'Escritura entregada',
  SignedDeedInProgress = 'Escritura firmada en tramite de RPP o Catastro',
  PendingSignature = 'Pendiente de Firma',
  NoPayment = 'No ha realizado pago de impuestos y derechos',
}

export enum TriStateStatus {
  Yes = 'Sí',
  No = 'No',
  NotAvailable = 'No hay información',
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

// New enums for BasicInfoSheet
export enum Gender {
  Female = 'Mujer',
  Male = 'Hombre',
  PreferNotToSay = 'Prefiero no decirlo',
}

export enum MaritalStatus {
  Single = 'Soltera/o',
  Married = 'Casada/o',
  FreeUnion = 'Unión libre',
  Separated = 'Separada/o',
  Widowed = 'Viuda/o',
}

export enum HousingType {
  OwnNoMortgage = 'Propia (sin hipoteca)',
  OwnWithMortgage = 'Propia (con hipoteca o crédito en curso)',
  Rented = 'Rentada',
  Borrowed = 'Prestada',
  WithFamily = 'Vive con familiares',
}

export enum ResidencyTime {
  LessThan1Year = 'Menos de 1 año',
  From1To3Years = '1–3 años',
  From4To10Years = '4–10 años',
  MoreThan10Years = 'Más de 10 años',
}

export enum Occupation {
  Employed = 'Empleada/o',
  OwnBusiness = 'Negocio propio',
  SelfEmployed = 'Trabajo por cuenta propia',
  Housewife = 'Ama de casa',
  Farmer = 'Agricultor/a',
  Other = 'Otro',
}

export enum MonthlyIncome {
  LessThan5k = 'Menos de $5,000',
  Between5kAnd10k = 'Entre $5,000 y $10,000',
  MoreThan10k = 'Más de $10,000',
}

export enum Dependents {
  None = 'Ninguno',
  OneToTwo = '1–2',
  ThreeToFour = '3–4',
  MoreThanFour = 'Más de 4',
}

export enum HousingSupportInterest {
  Yes = 'Sí',
  No = 'No',
  NotSure = 'Aún no estoy segura/o',
}

export enum ImprovementType {
  NewHome = 'Construcción de vivienda nueva',
  Completion = 'Terminación (muros, techo, piso, baño, etc.)',
  Expansion = 'Ampliación (cuarto adicional, cocina, baño)',
  Regularization = 'Regularización o escrituración',
  Other = 'Otro',
}

export enum PreferredContact {
  Phone = 'Llamada telefónica',
  WhatsApp = 'WhatsApp',
  InPerson = 'Visita en domicilio',
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
  procedureStatus?: Record<string, {
    status: 'No iniciado' | 'Siendo asesorado' | 'Completado';
    subStatus?: 'Pendiente de entrega de documentación' | 'Documento en presidencia municipal' | '';
  }>;
  // Old fields for migration
  tramiteActual?: string;
  estatusTramite?: string;
  tramiteAnterior?: string;
  siguienteTramite?: string;
  // Other fields
  contactCount: number;
  recibioFlyer: boolean;
  fechaUltimoContacto: string; // YYYY-MM-DD
  fechaSeguimiento: string; // YYYY-MM-DD
  observaciones: string;
}


export interface DirectPromotionFIData {
  // Old fields for migration - marked as optional
  contactado?: boolean;
  citaInformacion?: string; // Will be migrated to fechaCitaAsesoria
  recibioAsesoria?: boolean; // Will be migrated to agendoCitaAsesoria
  seguimiento?: boolean;

  // Kept fields
  recibioFlyer?: boolean;
  institucion?: string;
  observaciones?: string;

  // New/Consolidated fields
  agendoCitaAsesoria?: boolean;
  fechaCitaAsesoria?: string; // YYYY-MM-DD
  productoInteres?: string;
  fechaUltimoContacto?: string; // YYYY-MM-DD
  numeroContacto?: number;
  recordatorioProximoContacto?: string; // YYYY-MM-DD
  
  solicitoInformacionIF?: boolean;
  logroCredito?: boolean; // Equivalent to 'Accedió a producto financiero'
  montoCredito?: number;
}

export interface TechnicalAssistanceIncentiveData {
  startedConstructionWithin60Days: boolean;
  notes: string;
}


export interface CustomerStrategy {
  strategyId: string;
  offered?: boolean;
  accepted: boolean;
  status: StrategyStatus;
  lastUpdate: string;
  tasks: Task[];
  customData?: Record<string, any>;
  lastOfferContactDate?: string;
  offerComments?: string;
}

export interface BasicInfo {
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  curp?: string;
  addressMunicipality?: string;
  addressColonia?: string;
  addressStreet?: string;
  addressPostalCode?: string;
  alternatePhone?: string;
  housingType?: HousingType;
  residencyTime?: ResidencyTime;
  hasOtherProperty?: boolean;
  occupation?: Occupation;
  occupationOther?: string;
  monthlyIncome?: MonthlyIncome;
  dependents?: Dependents;
  hasCreditOrSavings?: boolean;
  creditOrSavingsInfo?: string;
  belongsToSavingsGroup?: boolean;
  savingsGroupInfo?: string;
  wantsHousingSupport?: HousingSupportInterest;
  improvementType?: ImprovementType;
  improvementTypeOther?: string;
  preferredContactMethod?: PreferredContact;
  promoterObservations?: string;
}

export interface ChangeLogEntry {
  timestamp: string; // ISO 8601 format
  user: string;
  description: string;
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
  hasCredit: TriStateStatus;
  hasSavings: TriStateStatus;
  motivation: string;
  group: string;
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
  atcAmount?: number;
  atcFolderDeliveryDate?: string; // YYYY-MM-DD
  atcPrototype?: number;
  atcPrototypeType?: 'Moderno' | 'Tradicional' | '';
  basicInfo?: BasicInfo;
  history?: ChangeLogEntry[];
}