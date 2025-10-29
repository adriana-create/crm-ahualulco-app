import { useState, useCallback, useEffect } from 'react';
import { Customer, LegalStatus, StrategyStatus, Task, CustomerStrategy, FinancialStatus, StatusCarpetaATC, SolidarityTitlingLoanData, TailoredLegalSupportData, DirectPromotionFIData } from '../types';
import { LOAN_AMOUNT, NUM_PAYMENTS, STRATEGY_SPECIFIC_FIELDS } from '../constants';

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
        if (data && data.tramiteActual === 'Inicio de construcción' && data.estatusTramite === 'Completado') {
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
        if (data && (data.fechaUltimoContacto || data.tramiteActual || data.responsable)) {
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
        const typedCustomers = result.data.map((c: any) => ({
            ...c,
            strategies: Array.isArray(c.strategies) 
                ? c.strategies.map((s: any) => ({ ...s, tasks: Array.isArray(s.tasks) ? s.tasks : [] })) 
                : [],
            potentialStrategies: Array.isArray(c.potentialStrategies) ? c.potentialStrategies : [],
            lots: parseInt(c.lots, 10) || 0,
            pathwayToTitling: parseInt(c.pathwayToTitling, 10) || 0,
            financialProgress: parseInt(c.financialProgress, 10) || 0,
            hasTituloPropiedad: !!c.hasTituloPropiedad,
            hasDeslinde: !!c.hasDeslinde,
            hasPermisoConstruccion: !!c.hasPermisoConstruccion,
            modificacionLote: !!c.modificacionLote,
            contratoATC: !!c.contratoATC,
            pagoATC: !!c.pagoATC,
            statusCarpetaATC: c.statusCarpetaATC || StatusCarpetaATC.NotApplicable,
            recordatorioEntregaCarpeta: c.recordatorioEntregaCarpeta || '',
            responsable: c.responsable || '',
            startedConstruction: !!c.startedConstruction,
        }));
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

  const updateCustomer = async (updatedCustomer: Customer) => {
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
      setLastSyncTime(new Date());
    } catch (error) {
      alert('No se pudieron guardar los cambios. Por favor, inténtelo de nuevo.');
      fetchCustomers();
    }
  };

  const updateCustomerDetails = useCallback((customerId: string, details: Partial<Pick<Customer, 'legalStatus' | 'manzana' | 'lote' | 'financialStatus' | 'motivation' | 'financialProgress' | 'modificacionLote' | 'contratoATC' | 'pagoATC' | 'statusCarpetaATC' | 'recordatorioEntregaCarpeta' | 'responsable' | 'startedConstruction' | 'hasTituloPropiedad' | 'hasDeslinde' | 'hasPermisoConstruccion'>>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const tempUpdatedCustomer = { ...customer, ...details };

    let completedSteps = 0;
    if (tempUpdatedCustomer.hasTituloPropiedad) completedSteps++;
    if (tempUpdatedCustomer.hasDeslinde) completedSteps++;
    if (tempUpdatedCustomer.hasPermisoConstruccion) completedSteps++;
    
    const newPathwayPercentage = Math.round((completedSteps / 3) * 100);

    let updatedCustomer = {
        ...tempUpdatedCustomer,
        pathwayToTitling: newPathwayPercentage,
        lastUpdate: new Date().toISOString()
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
            updatedCustomer.group = newGroup;
        }
    }
    updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);

  const updateCustomerStrategy = useCallback((customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const newStrategies = customer.strategies.map(strategy => 
        strategy.strategyId === strategyId
            ? { ...strategy, ...updatedStrategy, lastUpdate: new Date().toISOString() }
            : strategy
    );

    const updatedCustomer = {
        ...customer,
        strategies: newStrategies,
        lastUpdate: new Date().toISOString(),
    };
    updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);
  
  const updateTask = useCallback((customerId: string, strategyId: string, taskId: string, updatedTask: Partial<Task>) => {
     const customer = getCustomerById(customerId);
     if (!customer) return;

     const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: new Date().toISOString(),
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
         lastUpdate: new Date().toISOString(),
     };
     updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);

  const addTask = useCallback((customerId: string, strategyId:string, task: Omit<Task, 'id' | 'isCompleted'>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;
    
    const newTask: Task = {
        ...task,
        id: `TASK-${Date.now()}`,
        isCompleted: false,
    };

    const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: new Date().toISOString(),
                tasks: [...strategy.tasks, newTask]
            };
        }
        return strategy;
    });

    const updatedCustomer = {
        ...customer,
        strategies: newStrategies,
        lastUpdate: new Date().toISOString(),
    };
    updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);

  const updateCustomerStrategyCustomData = useCallback((customerId: string, strategyId: string, key: string, value: string | number | boolean) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const newStrategies = customer.strategies.map(strategy => {
        if (strategy.strategyId === strategyId) {
            return {
                ...strategy,
                lastUpdate: new Date().toISOString(),
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
        lastUpdate: new Date().toISOString(),
    };
    updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);

  const updateCustomerPotentialStrategies = useCallback((customerId: string, strategyIds: string[]) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    const updatedCustomer = { 
      ...customer, 
      potentialStrategies: strategyIds, 
      lastUpdate: new Date().toISOString() 
    };
    updateCustomer(updatedCustomer);
  }, [customers, getCustomerById]);

  const addStrategyToCustomer = useCallback((customerId: string, strategyId: string) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    if (customer.strategies.some(s => s.strategyId === strategyId)) {
        console.warn(`Strategy ${strategyId} already active for customer ${customerId}`);
        return;
    }

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
        customData = {
            tramiteActual: '',
            estatusTramite: '',
            contactado: false,
            recibioFlyer: false,
            recibioAsesoria: false,
            fechaUltimoContacto: '',
            fechaSeguimiento: '',
            seguimientoRealizado: false,
            tramiteAnterior: '',
            siguienteTramite: '',
            responsable: '',
            observaciones: '',
            enviarRecordatorio: false
        };
    } else if (strategyId === 'DPFI') {
        customData = {
            contactado: false,
            citaInformacion: '',
            recibioFlyer: false,
            recibioAsesoria: false,
            fechaUltimoContacto: '',
            seguimiento: false,
            responsable: '',
            logroCredito: false,
            institucion: '',
            montoCredito: 0,
            observaciones: ''
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
        accepted: false,
        status: StrategyStatus.NotStarted,
        lastUpdate: new Date().toISOString(),
        tasks: [],
        customData,
    };
    
    const updatedCustomer = {
        ...customer,
        strategies: [...customer.strategies, newStrategy],
        lastUpdate: new Date().toISOString(),
    };

    updateCustomer(updatedCustomer);

  }, [customers, getCustomerById]);


  const importCustomers = useCallback(async (csvString: string) => {
    if (!csvString.trim()) {
        alert("El archivo CSV está vacío.");
        return;
    }
    setLoading(true);
    try {
        const result = await apiRequest('IMPORT_CUSTOMERS', { csvString });
        const count = result.data?.count ?? result.count ?? 'algunos';
        alert(`¡Se importaron con éxito ${count} nuevos clientes!`);
        await fetchCustomers();
    } catch (error) {
        alert(`Error al importar clientes. Revise el formato del CSV y la consola para más detalles. Detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        setLoading(false);
    }
  }, [fetchCustomers]);

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
    updateCustomerStrategy, 
    updateTask, 
    addTask, 
    updateCustomerStrategyCustomData, 
    updateCustomerPotentialStrategies, 
    addStrategyToCustomer,
    importCustomers, 
    deleteCustomer 
  };
};