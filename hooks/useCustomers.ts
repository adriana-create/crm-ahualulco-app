

import { useState, useCallback, useEffect } from 'react';
import { Customer, LegalStatus, StrategyStatus, Task, CustomerStrategy, StatusCarpetaATC, SolidarityTitlingLoanData, TailoredLegalSupportData, DirectPromotionFIData, BasicInfo, TriStateStatus, ChangeLogEntry, Abono } from '../types';
import { LOAN_AMOUNT, NUM_PAYMENTS, STRATEGY_SPECIFIC_FIELDS, LEGAL_PROCEDURES, STRATEGIES } from '../constants';

// IMPORTANT: Paste your deployed Google Apps Script URL here.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFi30K7rm-4ApAMHXAd0IbLXBMrXxlaecXMoYThnjwSOAFGHOXbDYWBikF2r3ekufm/exec';

const fetchFromScript = async (action: string, payload: any) => {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            mode: 'cors',
            body: JSON.stringify({ action, payload }),
        });
        const responseText = await response.text();
        if (!response.ok) {
            const errorDetails = responseText && !responseText.trim().startsWith('<')
                ? responseText
                : `Error del servidor: ${response.status} ${response.statusText}`;
            throw new Error(errorDetails);
        }
        try {
            if (!responseText) {
                return { success: true, data: [] };
            }
            return JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error al analizar la respuesta JSON:", responseText);
            throw new Error("Se recibió una respuesta inválida del servidor. Verifique el formato de los datos en Google Apps Script.");
        }
    } catch (error) {
        throw error;
    }
};

const apiRequest = async (action: string, payload: any) => {
    try {
        const result = await fetchFromScript(action, payload);
        if (!result.success) {
            console.error('API Error:', result.message);
            throw new Error(result.message || 'Ocurrió un error no especificado en la API.');
        }
        return result;
    } catch (error) {
        console.error(`Error al realizar la acción "${action}":`, error);
        throw error;
    }
};

const recalculateStrategyStatus = (strategy: CustomerStrategy): StrategyStatus => {
    const { status, strategyId, tasks, customData, accepted } = strategy;

    if (status === StrategyStatus.OnHold || status === StrategyStatus.Rejected) {
        return status;
    }

    let isCompleted = false;
    if (strategyId === 'STL') {
        const data = customData as SolidarityTitlingLoanData;
        if (data && data.abonos) {
            const totalAbonado = data.abonos.reduce((acc, abono) => acc + (abono.realizado && abono.validado ? Number(abono.cantidad) || 0 : 0), 0);
            if (data.montoPrestamo > 0 && totalAbonado >= data.montoPrestamo) {
                isCompleted = true;
            }
        }
    } else if (strategyId === 'TLS') {
        const data = customData as TailoredLegalSupportData;
        const lastProcedure = LEGAL_PROCEDURES[LEGAL_PROCEDURES.length - 1];
        if (data && data.procedureStatus && data.procedureStatus[lastProcedure]?.status === 'Completado') {
            isCompleted = true;
        }
    } else if (strategyId === 'DPFI') {
        const data = customData as DirectPromotionFIData;
        if (data && data.logroCredito) {
            isCompleted = true;
        }
    }

    if (tasks.length > 0 && tasks.every(t => t.isCompleted)) {
        isCompleted = true;
    }

    if (isCompleted) {
        return StrategyStatus.Completed;
    }

    let isInProgress = false;
    if (accepted || tasks.length > 0) {
        isInProgress = true;
    }

    if (strategyId === 'STL') {
        const data = customData as SolidarityTitlingLoanData;
        if (data && (data.expediente || data.firmoAdenda || data.abonos?.some(a => a.realizado))) {
            isInProgress = true;
        }
    } else if (strategyId === 'TLS') {
        const data = customData as TailoredLegalSupportData;
        if (data && (data.contactCount > 0 || (data.procedureStatus && Object.values(data.procedureStatus).some(s => s.status !== 'No iniciado')))) {
            isInProgress = true;
        }
    } else if (strategyId === 'DPFI') {
        const data = customData as DirectPromotionFIData;
        if (data && (data.fechaUltimoContacto || data.institucion || data.logroCredito)) {
            isInProgress = true;
        }
    }

    if (isInProgress) {
        return StrategyStatus.InProgress;
    }

    return StrategyStatus.NotStarted;
};


export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const toBoolean = (val: any): boolean => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
          return ['true', 'verdadero', 'sí', 'si', '1'].includes(val.toLowerCase().trim());
      }
      return !!val;
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFromScript('GET_CUSTOMERS', {});
      if (result.success) {
        if (!Array.isArray(result.data)) {
            console.error("Data received from API is not an array:", result.data);
            throw new Error("Se recibió un formato de datos inesperado del servidor.");
        }
        const typedCustomers = result.data.map((c: any) => {
            // Data migration for hasCredit and hasSavings
            let hasCredit: TriStateStatus;
            if (c.hasCredit && Object.values(TriStateStatus).includes(c.hasCredit)) {
                hasCredit = c.hasCredit;
            } else {
                switch (c.financialStatus) {
                    case 'Crédito Vigente':
                    case 'Pagado':
                    case 'En Mora':
                        hasCredit = TriStateStatus.Yes;
                        break;
                    case 'Sin Crédito':
                        hasCredit = TriStateStatus.No;
                        break;
                    default:
                        hasCredit = TriStateStatus.NotAvailable;
                }
            }

            const hasSavings: TriStateStatus = (c.hasSavings && Object.values(TriStateStatus).includes(c.hasSavings)) 
                ? c.hasSavings 
                : TriStateStatus.NotAvailable;


            return {
                ...c,
                strategies: Array.isArray(c.strategies) 
                    ? c.strategies.map((s: any) => {
                        // Data migration for TLS strategy
                        if (s.strategyId === 'TLS' && s.customData) {
                            const data = s.customData as any; // Old data structure
                             // First migration: from old fields to procedureStatus record of strings
                            if (!data.procedureStatus) {
                                const procedureStatus: Record<string, 'No iniciado' | 'En proceso' | 'Completado'> = {};
                                const oldProcedures = ["Título de propiedad", "Deslinde", "Permiso de construcción", "Inicio de construcción"];
                                const currentProcedureIndex = data.tramiteActual ? oldProcedures.indexOf(data.tramiteActual) : -1;
                                
                                LEGAL_PROCEDURES.forEach(proc => {
                                    const procIndexInOldList = oldProcedures.indexOf(proc);
                                    if (currentProcedureIndex !== -1 && procIndexInOldList < currentProcedureIndex) {
                                        procedureStatus[proc] = 'Completado';
                                    } else if (currentProcedureIndex !== -1 && procIndexInOldList === currentProcedureIndex) {
                                        procedureStatus[proc] = data.estatusTramite || 'No iniciado';
                                    } else {
                                        procedureStatus[proc] = 'No iniciado';
                                    }
                                });

                                data.procedureStatus = procedureStatus;
                            }

                            // Second migration: from procedureStatus record of strings to record of objects
                            if (data.procedureStatus) {
                                const statusRecord = data.procedureStatus as Record<string, any>;
                                const firstValue = Object.values(statusRecord)[0];
                                if (typeof firstValue === 'string') {
                                    const newStatusRecord: TailoredLegalSupportData['procedureStatus'] = {};
                                    for (const proc in statusRecord) {
                                        const oldStatus = statusRecord[proc];
                                        if (oldStatus === 'En proceso') {
                                            newStatusRecord[proc] = { status: 'Siendo asesorado', subStatus: '' };
                                        } else if (oldStatus === 'Completado') {
                                            newStatusRecord[proc] = { status: 'Completado' };
                                        } else {
                                            newStatusRecord[proc] = { status: 'No iniciado' };
                                        }
                                    }
                                    data.procedureStatus = newStatusRecord;
                                }
                            }
                            
                            // Third migration: from booleans to contactCount
                            if (data.contactado !== undefined) {
                                if (!data.contactCount) {
                                    data.contactCount = data.contactado ? 1 : 0;
                                }
                                delete data.contactado;
                            }
                            if (data.contactCount === undefined) {
                                data.contactCount = 0;
                            }
                            delete data.recibioAsesoria;
                            delete data.seguimientoRealizado;
                            delete data.enviarRecordatorio;
                            s.customData = data;
                        }
                         // Data migration for DPFI strategy
                        if (s.strategyId === 'DPFI' && s.customData) {
                            const data = s.customData as any;
                            const customData: DirectPromotionFIData = { ...data };

                            // Migrate citaInformacion to fechaCitaAsesoria
                            if (data.citaInformacion && !data.fechaCitaAsesoria) {
                                customData.fechaCitaAsesoria = data.citaInformacion;
                                delete customData.citaInformacion;
                            }
                            
                            // Migrate contactado to numeroContacto
                            if (typeof data.contactado !== 'undefined' && typeof data.numeroContacto === 'undefined') {
                                customData.numeroContacto = data.contactado ? 1 : 0;
                                delete customData.contactado;
                            }
                            
                            // Migrate recibioAsesoria to agendoCitaAsesoria
                            if (typeof data.recibioAsesoria !== 'undefined' && typeof data.agendoCitaAsesoria === 'undefined') {
                                customData.agendoCitaAsesoria = data.recibioAsesoria;
                                delete customData.recibioAsesoria;
                            }
                            
                            // Remove old 'seguimiento' field
                            if (typeof data.seguimiento !== 'undefined') {
                                delete customData.seguimiento;
                            }
                            
                            s.customData = customData;
                        }
                        return {
                          ...s,
                          tasks: Array.isArray(s.tasks) ? s.tasks : [],
                          lastOfferContactDate: s.lastOfferContactDate || '',
                          offerComments: s.offerComments || '',
                          offered: toBoolean(s.offered),
                          accepted: toBoolean(s.accepted),
                        }
                    }) 
                    : [],
                potentialStrategies: Array.isArray(c.potentialStrategies) ? c.potentialStrategies : [],
                lots: parseInt(c.lots, 10) || 0,
                pathwayToTitling: parseInt(c.pathwayToTitling, 10) || 0,
                hasCredit,
                hasSavings,
                hasTituloPropiedad: toBoolean(c.hasTituloPropiedad),
                hasDeslinde: toBoolean(c.hasDeslinde),
                hasPermisoConstruccion: toBoolean(c.hasPermisoConstruccion),
                modificacionLote: toBoolean(c.modificacionLote),
                contratoATC: toBoolean(c.contratoATC),
                pagoATC: toBoolean(c.pagoATC),
                statusCarpetaATC: c.statusCarpetaATC || StatusCarpetaATC.NotApplicable,
                recordatorioEntregaCarpeta: c.recordatorioEntregaCarpeta || '',
                responsable: c.responsable || '',
                startedConstruction: toBoolean(c.startedConstruction),
                atcAmount: c.atcAmount ? parseFloat(c.atcAmount) : 0,
                atcFolderDeliveryDate: c.atcFolderDeliveryDate || '',
                atcPrototype: c.atcPrototype ? parseInt(c.atcPrototype, 10) : undefined,
                atcPrototypeType: c.atcPrototypeType || '',
                basicInfo: c.basicInfo || {
                    birthDate: '',
                    gender: undefined,
                    maritalStatus: undefined,
                    curp: '',
                    addressMunicipality: '',
                    addressColonia: '',
                    addressStreet: '',
                    addressPostalCode: '',
                    alternatePhone: '',
                    housingType: undefined,
                    residencyTime: undefined,
                    hasOtherProperty: false,
                    occupation: undefined,
                    occupationOther: '',
                    monthlyIncome: undefined,
                    dependents: undefined,
                    hasCreditOrSavings: false,
                    creditOrSavingsInfo: '',
                    belongsToSavingsGroup: false,
                    savingsGroupInfo: '',
                    wantsHousingSupport: undefined,
                    improvementType: undefined,
                    improvementTypeOther: '',
                    preferredContactMethod: undefined,
                    promoterObservations: ''
                },
                history: Array.isArray(c.history) ? c.history : [],
            }
        });
        setCustomers(typedCustomers);
        setLastSyncTime(new Date());
      } else {
         const errorMessage = result.message || 'La API devolvió un error pero no especificó un mensaje.';
         console.error('Error al cargar clientes:', errorMessage);
         setError(errorMessage);
         setCustomers([]);
      }
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
       console.error('Error al cargar clientes:', err);
       setError(`Error de Conexión: No se pudo conectar a la base de datos. Por favor, verifique que la URL del Google Apps Script sea correcta y que el despliegue web esté configurado con acceso para 'Cualquier persona'. Detalles: ${errorMessage}`);
       setCustomers([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const getCustomerById = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const logHistory = useCallback(async (customerId: string, newLogs: ChangeLogEntry[]) => {
      if (newLogs.length === 0) return;
      try {
          await apiRequest('LOG_HISTORY', { customerId, logs: newLogs });
      } catch (error) {
          console.error("Failed to log history to the backend:", error);
          // Optional: Handle this error, e.g., by queueing logs for a retry.
          // For now, we'll just log it to the console.
      }
  }, []);

  const updateCustomer = async (updatedCustomer: Customer, newLogs: ChangeLogEntry[] = []) => {
    const customerWithRecalculatedStatuses = {
        ...updatedCustomer,
        strategies: updatedCustomer.strategies.map(strat => ({
            ...strat,
            status: recalculateStrategyStatus(strat)
        }))
    };
    
    setCustomers(prev => prev.map(c => c.id === customerWithRecalculatedStatuses.id ? customerWithRecalculatedStatuses : c));
    
    try {
      await apiRequest('UPDATE_CUSTOMER', { customer: customerWithRecalculatedStatuses });
      if (newLogs.length > 0) {
        await logHistory(customerWithRecalculatedStatuses.id, newLogs);
      }
      setLastSyncTime(new Date());
    } catch (error) {
      alert('No se pudieron guardar los cambios. Por favor, inténtelo de nuevo.');
      fetchCustomers();
    }
  };

  const updateCustomerDetails = useCallback((customerId: string, details: Partial<Pick<Customer, 'legalStatus' | 'manzana' | 'lote' | 'hasCredit' | 'hasSavings' | 'motivation' | 'modificacionLote' | 'contratoATC' | 'pagoATC' | 'statusCarpetaATC' | 'recordatorioEntregaCarpeta' | 'responsable' | 'startedConstruction' | 'hasTituloPropiedad' | 'hasDeslinde' | 'hasPermisoConstruccion' | 'atcAmount' | 'atcFolderDeliveryDate' | 'atcPrototype' | 'atcPrototypeType'>>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";

    const fieldLabels: Record<string, string> = {
        legalStatus: 'Estatus Legal', responsable: 'Responsable', manzana: 'Manzana', lote: 'Lote', hasCredit: 'Tiene Crédito',
        hasSavings: 'Tiene Ahorros', motivation: 'Motivación', modificacionLote: 'Modificación de Lote', contratoATC: 'Contrato ATC',
        pagoATC: 'Pago ATC', statusCarpetaATC: 'Estatus Carpeta ATC', recordatorioEntregaCarpeta: 'Recordatorio Carpeta',
        startedConstruction: 'Inició Construcción', hasTituloPropiedad: 'Título de Propiedad', hasDeslinde: 'Deslinde',
        hasPermisoConstruccion: 'Permiso de Construcción', atcAmount: 'Monto ATC', atcFolderDeliveryDate: 'Fecha Entrega Carpeta',
        atcPrototype: 'Prototipo ATC', atcPrototypeType: 'Tipo Prototipo ATC'
    };

    Object.entries(details).forEach(([key, value]) => {
        if (customer[key as keyof Customer] !== value) {
            const oldValue = customer[key as keyof Customer];
            logs.push({
                timestamp: now, user,
                description: `Actualizó "${fieldLabels[key] || key}" de "${oldValue}" a "${value}".`
            });
        }
    });

    const tempUpdatedCustomer = { ...customer, ...details };

    let completedSteps = 0;
    if (tempUpdatedCustomer.hasTituloPropiedad) completedSteps++;
    if (tempUpdatedCustomer.hasDeslinde) completedSteps++;
    if (tempUpdatedCustomer.hasPermisoConstruccion) completedSteps++;
    
    const newPathwayPercentage = Math.round((completedSteps / 3) * 100);

    let updatedCustomer = {
        ...tempUpdatedCustomer,
        pathwayToTitling: newPathwayPercentage,
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };
    
    if (details.legalStatus) {
        const groupMapping: Partial<Record<LegalStatus, string>> = {
            [LegalStatus.DeedDelivered]: "Grupo 1",
            [LegalStatus.SignedDeedInProgress]: "Grupo 2",
            [LegalStatus.PendingSignature]: "Grupo 3",
            [LegalStatus.NoPayment]: "Grupo 4",
        };
        const newGroup = groupMapping[details.legalStatus];
        if (newGroup) {
            if (customer.group !== newGroup) {
                logs.push({ timestamp: now, user, description: `Cambió de grupo automáticamente a "${newGroup}".`});
            }
            updatedCustomer.group = newGroup;
        }
    }
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const updateCustomerBasicInfo = useCallback((customerId: string, updatedInfo: Partial<BasicInfo>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    logs.push({ timestamp: now, user, description: `Actualizó la Ficha Básica de Información.` });

    const updatedCustomer = {
        ...customer,
        basicInfo: {
            ...(customer.basicInfo || {}), 
            ...updatedInfo,
        },
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const updateCustomerStrategy = useCallback((customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    const strategyName = STRATEGIES.find(s => s.id === strategyId)?.name || strategyId;
    const oldStrategy = customer.strategies.find(s => s.strategyId === strategyId);

    if (oldStrategy) {
        if (updatedStrategy.accepted !== undefined && oldStrategy.accepted !== updatedStrategy.accepted) {
            logs.push({ timestamp: now, user, description: `Cliente ${updatedStrategy.accepted ? 'aceptó' : 'ya no participa en'} la estrategia "${strategyName}".`});
        }
        if (updatedStrategy.status !== undefined && oldStrategy.status !== updatedStrategy.status) {
            logs.push({ timestamp: now, user, description: `Estatus de "${strategyName}" cambió a "${updatedStrategy.status}".`});
        }
    }


    const newStrategies = customer.strategies.map(strategy => 
        strategy.strategyId === strategyId
            ? { ...strategy, ...updatedStrategy, lastUpdate: new Date().toISOString() }
            : strategy
    );

    const updatedCustomer = {
        ...customer,
        strategies: newStrategies,
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);
  
  const updateTask = useCallback((customerId: string, strategyId: string, taskId: string, updatedTask: Partial<Task>) => {
     const customer = getCustomerById(customerId);
     if (!customer) return;

     const logs: ChangeLogEntry[] = [];
     const now = new Date().toISOString();
     const user = "Sistema CRM";
     const strategyName = STRATEGIES.find(s => s.id === strategyId)?.name || strategyId;
     
     const oldTask = customer.strategies.find(s => s.strategyId === strategyId)?.tasks.find(t => t.id === taskId);
     if (oldTask && updatedTask.isCompleted !== undefined && oldTask.isCompleted !== updatedTask.isCompleted) {
         logs.push({ timestamp: now, user, description: `Marcó la tarea "${oldTask.description}" como ${updatedTask.isCompleted ? 'completada' : 'pendiente'} en "${strategyName}".` });
     }

     const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: now,
                tasks: strategy.tasks.map(task => 
                    task.id === taskId ? { ...task, ...updatedTask } : task
                )
            };
        }
        return strategy;
     });

     const updatedCustomer = {
         ...customer,
         strategies: newStrategies,
         lastUpdate: now,
         history: [...logs, ...(customer.history || [])],
     };
     updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const addTask = useCallback((customerId: string, strategyId:string, task: Omit<Task, 'id' | 'isCompleted'>, detailsToMerge: Partial<Customer> = {}) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;
    
    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    const strategyName = STRATEGIES.find(s => s.id === strategyId)?.name || strategyId;
    logs.push({ timestamp: now, user, description: `Agregó nueva tarea a "${strategyName}": ${task.description}.` });

    const newTask: Task = {
        ...task,
        id: `TASK-${Date.now()}`,
        isCompleted: false,
    };

    const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: now,
                tasks: [...strategy.tasks, newTask]
            };
        }
        return strategy;
    });

    const updatedCustomer = {
        ...customer,
        ...detailsToMerge,
        strategies: newStrategies,
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const updateCustomerStrategyCustomData = useCallback((customerId: string, strategyId: string, key: string, value: string | number | boolean) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    const strategyName = STRATEGIES.find(s => s.id === strategyId)?.name || strategyId;
    const oldStrategy = customer.strategies.find(s => s.strategyId === strategyId);
    
    if (oldStrategy && oldStrategy.customData?.[key] !== value) {
        logs.push({ timestamp: now, user, description: `Actualizó un detalle en la estrategia "${strategyName}".` });
    }

    const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: now,
                customData: {
                    ...strategy.customData,
                    [key]: value,
                }
            };
        }
        return strategy;
    });

    const updatedCustomer = {
        ...customer,
        strategies: newStrategies,
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const updateCustomerPotentialStrategies = useCallback((customerId: string, strategyIds: string[]) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    logs.push({ timestamp: now, user, description: `Actualizó las estrategias potenciales.` });

    const updatedCustomer = { 
      ...customer, 
      potentialStrategies: strategyIds, 
      lastUpdate: now,
      history: [...logs, ...(customer.history || [])],
    };
    updateCustomer(updatedCustomer, logs);
  }, [customers, getCustomerById]);

  const addStrategyToCustomer = useCallback((customerId: string, strategyId: string) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    if (customer.strategies.some(s => s.strategyId === strategyId)) {
        console.warn(`Strategy ${strategyId} already active for customer ${customerId}`);
        return;
    }

    const logs: ChangeLogEntry[] = [];
    const now = new Date().toISOString();
    const user = "Sistema CRM";
    const strategyName = STRATEGIES.find(s => s.id === strategyId)?.name || strategyId;
    logs.push({ timestamp: now, user, description: `Activó el seguimiento para la estrategia "${strategyName}".` });


    let customData: Record<string, any> = {};
    if (strategyId === 'STL') {
        customData = {
            referencia: '',
            riesgo: 'Bajo',
            expediente: '',
            montoPrestamo: LOAN_AMOUNT,
            firmoAdenda: false,
            modalidadAbono: '',
            abonos: Array(NUM_PAYMENTS).fill(null).map(() => ({
                realizado: false,
                cantidad: 0,
                fecha: '',
                formaDePago: '',
                comprobante: '',
                validado: false
            }))
        };
    } else if (strategyId === 'TLS') {
        const procedureStatus = LEGAL_PROCEDURES.reduce((acc, proc) => {
            acc[proc] = { status: 'No iniciado', subStatus: '' };
            return acc;
        }, {} as NonNullable<TailoredLegalSupportData['procedureStatus']>);
        customData = {
            procedureStatus,
            contactCount: 0,
            recibioFlyer: false,
            fechaUltimoContacto: '',
            fechaSeguimiento: '',
            observaciones: '',
        };
    } else if (strategyId === 'DPFI') {
        customData = {
            agendoCitaAsesoria: false,
            fechaCitaAsesoria: '',
            productoInteres: '',
            fechaUltimoContacto: '',
            numeroContacto: 0,
            recordatorioProximoContacto: '',
            solicitoInformacionIF: false,
            logroCredito: false,
            institucion: '',
            montoCredito: 0,
            observaciones: '',
            recibioFlyer: false,
        };
    } else if (strategyId === 'TAI') {
        customData = {
            startedConstructionWithin60Days: false,
            notes: '',
        };
    } else {
      const fields = STRATEGY_SPECIFIC_FIELDS[strategyId];
      if (fields) {
        customData = fields.reduce((acc, field) => {
          acc[field.key] = field.type === 'number' ? 0 : '';
          return acc;
        }, {} as Record<string, any>);
      }
    }

    const newStrategy: CustomerStrategy = {
        strategyId: strategyId,
        offered: false,
        accepted: false,
        status: StrategyStatus.NotStarted,
        lastUpdate: now,
        tasks: [],
        customData,
        lastOfferContactDate: '',
        offerComments: '',
    };
    
    const updatedCustomer = {
        ...customer,
        strategies: [...customer.strategies, newStrategy],
        lastUpdate: now,
        history: [...logs, ...(customer.history || [])],
    };

    updateCustomer(updatedCustomer, logs);

  }, [customers, getCustomerById]);


  const importCustomers = useCallback(async (csvString: string) => {
    if (!csvString.trim()) {
        alert("El archivo CSV está vacío.");
        return;
    }
    setLoading(true);
    try {
        const result = await apiRequest('ADD_CUSTOMERS_FROM_CSV', { csvString });
        const count = result.data?.count ?? result.count ?? 'algunos';
        alert(`¡Se importaron con éxito ${count} nuevos clientes!`);
        await fetchCustomers();
    } catch (error) {
        alert(`Error al importar clientes. Revise el formato del CSV y la consola para más detalles. Detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        setLoading(false);
    }
  }, [fetchCustomers]);
  
  const parseCsvForUpdate = (csvString: string): { headers: string[]; data: Record<string, string>[] } => {
      const lines = csvString.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
      if (lines.length < 2) return { headers: [], data: [] };

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const row: Record<string, string> = {};
          headers.forEach((header, i) => {
              let value = (values[i] || '').trim();
              if (value.startsWith('"') && value.endsWith('"')) {
                  value = value.substring(1, value.length - 1).replace(/""/g, '"');
              }
              row[header] = value;
          });
          return row;
      });
      return { headers, data };
  };

  const isBooleanHeader = (header: string): boolean => {
      const patterns = [
          /^has[A-Z]/, 
          /^basicInfo_has[A-Z]/,
          /_(offered|accepted|realizado|validado)$/,
          /_(firmoAdenda|recibioFlyer|agendoCitaAsesoria|solicitoInformacionIF|logroCredito|startedConstructionWithin60Days)$/,
      ];
      if (['modificacionLote', 'contratoATC', 'pagoATC', 'startedConstruction'].includes(header)) return true;
      return patterns.some(p => p.test(header));
  }
  
  const isNumberHeader = (header: string): boolean => {
      const patterns = [
        /_(cantidad|monto|amount|count|numero|prototype)$/i,
        /_lots$/,
        /_pathwayToTitling$/
      ];
      if (['lots', 'pathwayToTitling', 'atcAmount', 'atcPrototype'].includes(header)) return true;
      return patterns.some(p => p.test(header));
  }

  const getTypedValue = (header: string, value: string): any => {
      const cleanValue = value.trim();
      const localToBoolean = (val: string): boolean => ['true', 'verdadero', 'sí', 'si', '1'].includes(val.toLowerCase());

      if (isBooleanHeader(header)) {
          return localToBoolean(cleanValue);
      }
      
      if (isNumberHeader(header)) {
          if (cleanValue === '') return 0;
          const num = parseFloat(cleanValue);
          return isNaN(num) ? 0 : num;
      }
      
      return cleanValue;
  }

  const updateCustomersFromCsv = useCallback(async (csvString: string) => {
      if (!csvString.trim()) {
          alert("El archivo CSV está vacío.");
          return;
      }
      setLoading(true);
      setError(null);

      try {
          const { headers, data: rows } = parseCsvForUpdate(csvString);
          if (rows.length === 0) {
              alert("No se encontraron datos de clientes en el archivo CSV.");
              setLoading(false);
              return;
          }
          if (!headers.includes('id')) {
              throw new Error("El archivo CSV debe contener una columna 'id'.");
          }

          const customersToUpdate: Customer[] = [];
          const currentCustomersMap = new Map(customers.map(c => [c.id, c]));

          for (const row of rows) {
              const customerId = row.id;
              if (!customerId) continue;

              const originalCustomer = currentCustomersMap.get(customerId);
              if (!originalCustomer) {
                  console.warn(`Cliente con ID "${customerId}" del CSV no encontrado en la base de datos. Se omitirá.`);
                  continue;
              }

              const updatedCustomer: Customer = JSON.parse(JSON.stringify(originalCustomer));
              const now = new Date().toISOString();
              
              for (const header of headers) {
                  if (row[header] === undefined) continue;
                  
                  const newValue = getTypedValue(header, row[header]);
                  const parts = header.split('_');

                  try {
                       if (parts.length === 1 && header !== 'id') {
                          const key = header as keyof Customer;
                          (updatedCustomer as any)[key] = newValue;
                      } else if (parts[0] === 'basicInfo') {
                          const key = parts[1] as keyof BasicInfo;
                          if (!updatedCustomer.basicInfo) updatedCustomer.basicInfo = {};
                          (updatedCustomer.basicInfo as any)[key] = newValue;
                      } else if (STRATEGIES.some(s => s.id === parts[0])) {
                          const strategyId = parts[0];
                          let strategy = updatedCustomer.strategies.find(s => s.strategyId === strategyId);

                          if (!strategy) {
                                const newStrategy: CustomerStrategy = {
                                    strategyId: strategyId, offered: false, accepted: false,
                                    status: StrategyStatus.NotStarted, lastUpdate: now, tasks: [],
                                    customData: {}, lastOfferContactDate: '', offerComments: '',
                                };
                                if (strategyId === 'STL') {
                                    newStrategy.customData = {
                                        referencia: '',
                                        riesgo: 'Bajo',
                                        expediente: '',
                                        montoPrestamo: LOAN_AMOUNT,
                                        firmoAdenda: false,
                                        modalidadAbono: '',
                                        abonos: Array(NUM_PAYMENTS).fill(null).map(() => ({
                                            realizado: false,
                                            cantidad: 0,
                                            fecha: '',
                                            formaDePago: '',
                                            comprobante: '',
                                            validado: false
                                        }))
                                    };
                                } else if (strategyId === 'TLS') {
                                     newStrategy.customData = {
                                        procedureStatus: LEGAL_PROCEDURES.reduce((acc, proc) => {
                                            acc[proc] = { status: 'No iniciado', subStatus: '' };
                                            return acc;
                                        }, {} as NonNullable<TailoredLegalSupportData['procedureStatus']>)
                                    };
                                }
                                updatedCustomer.strategies.push(newStrategy);
                                strategy = newStrategy;
                          }
                          
                          if (!strategy.customData) strategy.customData = {};
                          
                          const field = parts[1];
                          const key = parts.slice(1).join('_') as keyof CustomerStrategy;

                          if (field === 'customData') {
                               const customDataKey = parts.slice(2).join('_');
                               if (strategyId === 'TLS' && customDataKey.includes('status') || customDataKey.includes('subStatus')) {
                                    const keyParts = parts.slice(2);
                                    const property = keyParts.pop() as 'status' | 'subStatus';
                                    const procedureKey = keyParts.join('_').replace(/_/g, ' ');
                                    const procedureName = LEGAL_PROCEDURES.find(p => p.toLowerCase() === procedureKey.toLowerCase());
                                    if(procedureName && property){
                                        const tlsData = strategy.customData as TailoredLegalSupportData;
                                        if (!tlsData.procedureStatus) tlsData.procedureStatus = {};
                                        if (!tlsData.procedureStatus[procedureName]) tlsData.procedureStatus[procedureName] = { status: 'No iniciado' };
                                        (tlsData.procedureStatus[procedureName] as any)[property] = newValue;
                                    }
                               } else {
                                  strategy.customData[customDataKey] = newValue;
                               }
                          } else if (strategyId === 'STL' && field === 'abono') {
                              const abonoIndex = parseInt(parts[2], 10) - 1;
                              const abonoField = parts[3] as keyof Abono;
                              const stlData = strategy.customData as SolidarityTitlingLoanData;
                              if (!stlData.abonos) stlData.abonos = Array(NUM_PAYMENTS).fill(null).map(() => ({ realizado: false, cantidad: 0, fecha: '', formaDePago: '', comprobante: '', validado: false }));
                              if (stlData.abonos[abonoIndex]) {
                                (stlData.abonos[abonoIndex] as any)[abonoField] = newValue;
                              }
                          } else {
                            (strategy as any)[key] = newValue;
                          }
                      }
                  } catch (e) {
                      console.error(`Error procesando la columna "${header}" para el cliente ${customerId}:`, e);
                  }
              }

              let completedSteps = 0;
              if (updatedCustomer.hasTituloPropiedad) completedSteps++;
              if (updatedCustomer.hasDeslinde) completedSteps++;
              if (updatedCustomer.hasPermisoConstruccion) completedSteps++;
              updatedCustomer.pathwayToTitling = Math.round((completedSteps / 3) * 100);

              updatedCustomer.lastUpdate = now;
              
              const customerLogs: ChangeLogEntry[] = [{ timestamp: now, user: "Sistema CRM (CSV)", description: `Actualizado masivamente desde archivo CSV.` }];
              updatedCustomer.history = [...customerLogs, ...(updatedCustomer.history || [])];
              customersToUpdate.push(updatedCustomer);
          }

          if (customersToUpdate.length === 0) {
              alert("No se encontraron cambios para aplicar en los clientes existentes.");
              setLoading(false);
              return;
          }
          
          setCustomers(prev => {
              const updatesMap = new Map(customersToUpdate.map(c => [c.id, c]));
              return prev.map(c => updatesMap.get(c.id) || c);
          });

          for (const customer of customersToUpdate) {
              await updateCustomer(customer, []); 
          }

          setLastSyncTime(new Date());
          alert(`¡Se procesaron con éxito las actualizaciones para ${customersToUpdate.length} clientes!`);

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setError(`Error al actualizar clientes: ${errorMessage}. Revise el formato del CSV y la consola.`);
          await fetchCustomers(); // Re-sync to ensure data consistency
      } finally {
          setLoading(false);
      }
  }, [customers, fetchCustomers, updateCustomer]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    try {
        await apiRequest('DELETE_CUSTOMER', { customerId });
        setLastSyncTime(new Date());
    } catch (error) {
        alert('Error al eliminar el cliente. La lista se actualizará.');
        fetchCustomers();
    }
  }, [fetchCustomers]);

  return { 
    customers,
    loading,
    error,
    lastSyncTime,
    fetchCustomers,
    getCustomerById, 
    updateCustomerDetails,
    updateCustomerBasicInfo, 
    updateCustomerStrategy, 
    updateTask, 
    addTask, 
    updateCustomerStrategyCustomData, 
    updateCustomerPotentialStrategies, 
    addStrategyToCustomer,
    importCustomers,
    updateCustomersFromCsv, 
    deleteCustomer 
  };
};