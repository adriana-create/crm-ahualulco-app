import { useState, useCallback, useEffect } from 'react';
import { Customer, LegalStatus, StrategyStatus, Task, CustomerStrategy, FinancialStatus, StatusCarpetaATC } from '../types';
import { LOAN_AMOUNT, NUM_PAYMENTS, STRATEGY_SPECIFIC_FIELDS } from '../constants';

// IMPORTANT: Paste your deployed Google Apps Script URL here.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFi30K7rm-4ApAMHXAd0IbLXBMrXxlaecXMoYThnjwSOAFGHOXbDYWBikF2r3ekufm/exec';

/**
 * A centralized and robust function for making API requests to the Google Apps Script.
 * It safely handles responses to prevent app crashes from malformed or non-JSON data.
 */
const fetchFromScript = async (action: string, payload: any) => {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // Using 'text/plain' is a reliable way to avoid CORS preflight requests
            // with Google Apps Script, which is a common source of "Failed to fetch".
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            mode: 'cors',
            body: JSON.stringify({ action, payload }),
        });

        // Always read the response as text first. This is safer than directly
        // calling .json() which can throw an uncatchable error in some cases.
        const responseText = await response.text();

        if (!response.ok) {
            // If the server returned an error (e.g., 404, 500), use the text as the error message.
            // We check for '<' to avoid displaying a full HTML error page from Google.
            const errorDetails = responseText && !responseText.trim().startsWith('<')
                ? responseText
                : `Error del servidor: ${response.status} ${response.statusText}`;
            throw new Error(errorDetails);
        }
        
        // If the response was successful (200 OK), now we can safely parse the text.
        try {
            // Handle cases where the response might be empty text
            if (!responseText) {
                return { success: true, data: [] }; // Assume success with empty data for empty response
            }
            return JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error al analizar la respuesta JSON:", responseText);
            throw new Error("Se recibió una respuesta inválida del servidor. Verifique el formato de los datos en Google Apps Script.");
        }

    } catch (error) {
        // This will catch network errors (like 'Failed to fetch'), errors thrown
        // from non-ok responses, and JSON parsing errors. Re-throw to be handled by the caller.
        throw error;
    }
};


// Helper function to handle the API's success/error envelope.
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
        // Let the calling function decide how to present the error to the user.
        throw error;
    }
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFromScript('GET_CUSTOMERS', {});
      if (result.success) {
        // DEFENSIVE CHECK: Ensure data from the API is an array to prevent crashes.
        if (!Array.isArray(result.data)) {
            console.error("Data received from API is not an array:", result.data);
            throw new Error("Se recibió un formato de datos inesperado del servidor.");
        }

        // Sanitize each customer object to ensure required array fields exist, preventing
        // downstream .map() or .filter() calls from crashing the app.
        const typedCustomers = result.data.map((c: any) => ({
            ...c,
            strategies: Array.isArray(c.strategies) 
                ? c.strategies.map((s: any) => ({ ...s, tasks: Array.isArray(s.tasks) ? s.tasks : [] })) 
                : [],
            potentialStrategies: Array.isArray(c.potentialStrategies) ? c.potentialStrategies : [],
            lots: parseInt(c.lots, 10) || 0,
            pathwayToTitling: parseInt(c.pathwayToTitling, 10) || 0,
            financialProgress: parseInt(c.financialProgress, 10) || 0,
            modificacionLote: !!c.modificacionLote,
            contratoATC: !!c.contratoATC,
            pagoATC: !!c.pagoATC,
            statusCarpetaATC: c.statusCarpetaATC || StatusCarpetaATC.NotApplicable,
            recordatorioEntregaCarpeta: c.recordatorioEntregaCarpeta || '',
            responsable: c.responsable || '',
        }));
        setCustomers(typedCustomers);

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

  // A generic update function that sends the entire customer object
  const updateCustomer = async (updatedCustomer: Customer) => {
    // Optimistic update
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    try {
      await apiRequest('UPDATE_CUSTOMER', { customer: updatedCustomer });
    } catch (error) {
      // Revert on failure
      alert('No se pudieron guardar los cambios. Por favor, inténtelo de nuevo.');
      fetchCustomers();
    }
  };

  const updateCustomerDetails = useCallback((customerId: string, details: Partial<Pick<Customer, 'legalStatus' | 'pathwayToTitling' | 'manzana' | 'lote' | 'financialStatus' | 'motivation' | 'financialProgress' | 'modificacionLote' | 'contratoATC' | 'pagoATC' | 'statusCarpetaATC' | 'recordatorioEntregaCarpeta' | 'responsable'>>) => {
    const customer = getCustomerById(customerId);
    if (!customer) return;

    let updatedCustomer = { ...customer, ...details, lastUpdate: new Date().toISOString() };
    
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
        await fetchCustomers(); // Refresh the list
    } catch (error) {
        alert(`Error al importar clientes. Revise el formato del CSV y la consola para más detalles. Detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        setLoading(false);
    }
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    // Optimistic delete
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    try {
        await apiRequest('DELETE_CUSTOMER', { customerId });
    } catch (error) {
        alert('Error al eliminar el cliente. La lista se actualizará.');
        fetchCustomers();
    }
  }, [fetchCustomers]);

  return { 
    customers,
    loading,
    error,
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