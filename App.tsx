import React, { useState, useCallback } from 'react';
import { useCustomers } from './hooks/useCustomers';
import CustomerTable from './components/CustomerTable';
import CustomerDetail from './components/CustomerDetail';
import Header from './components/Header';
import { STRATEGIES, LEGAL_PROCEDURES, NUM_PAYMENTS, STRATEGY_SPECIFIC_FIELDS } from './constants';
import type { Customer, BasicInfo } from './types';
import { SolidarityTitlingLoanData, TailoredLegalSupportData, DirectPromotionFIData, TechnicalAssistanceIncentiveData, Abono } from './types';

function App() {
  const { 
    customers, 
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
    deleteCustomer,
    loading,
    error,
    lastSyncTime,
    fetchCustomers
  } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const selectedCustomer = selectedCustomerId ? getCustomerById(selectedCustomerId) : null;

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleBack = () => {
    setSelectedCustomerId(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    deleteCustomer(customerId);
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null);
    }
  };

  const handleExportAll = useCallback(() => {
    if (customers.length === 0) {
        alert("No hay clientes para exportar.");
        return;
    }

    const baseHeaders = ['id', 'firstName', 'paternalLastName', 'maternalLastName', 'contact', 'lots', 'manzana', 'lote', 'legalStatus', 'pathwayToTitling', 'hasCredit', 'hasSavings', 'motivation', 'group', 'lastUpdate', 'potentialStrategies', 'hasTituloPropiedad', 'hasDeslinde', 'hasPermisoConstruccion', 'modificacionLote', 'contratoATC', 'pagoATC', 'statusCarpetaATC', 'recordatorioEntregaCarpeta', 'responsable', 'startedConstruction', 'atcAmount', 'atcFolderDeliveryDate', 'atcPrototype', 'atcPrototypeType'];
    
    const sampleBasicInfo: Required<BasicInfo> = {
        birthDate: '', gender: undefined, maritalStatus: undefined, curp: '', addressMunicipality: '', addressColonia: '', addressStreet: '', addressPostalCode: '', alternatePhone: '', housingType: undefined, residencyTime: undefined, hasOtherProperty: false, occupation: undefined, occupationOther: '', monthlyIncome: undefined, dependents: undefined, hasCreditOrSavings: false, creditOrSavingsInfo: '', belongsToSavingsGroup: false, savingsGroupInfo: '', wantsHousingSupport: undefined, improvementType: undefined, improvementTypeOther: '', preferredContactMethod: undefined, promoterObservations: ''
    };
    const basicInfoHeaders = Object.keys(sampleBasicInfo).map(key => `basicInfo_${key}`);

    const strategyHeaders: string[] = [];
    STRATEGIES.forEach(strategy => {
        strategyHeaders.push(`${strategy.id}_offered`, `${strategy.id}_accepted`, `${strategy.id}_status`, `${strategy.id}_lastOfferContactDate`, `${strategy.id}_offerComments`);
        
        if (strategy.id === 'STL') {
            strategyHeaders.push(`${strategy.id}_customData_referencia`, `${strategy.id}_customData_riesgo`, `${strategy.id}_customData_expediente`, `${strategy.id}_customData_montoPrestamo`, `${strategy.id}_customData_firmoAdenda`, `${strategy.id}_customData_modalidadAbono`);
            for (let i = 0; i < NUM_PAYMENTS; i++) {
                strategyHeaders.push(
                    `${strategy.id}_abono_${i+1}_realizado`, `${strategy.id}_abono_${i+1}_cantidad`, `${strategy.id}_abono_${i+1}_fecha`,
                    `${strategy.id}_abono_${i+1}_formaDePago`, `${strategy.id}_abono_${i+1}_comprobante`, `${strategy.id}_abono_${i+1}_validado`
                );
            }
        } else if (strategy.id === 'TLS') {
            strategyHeaders.push(`${strategy.id}_customData_contactCount`, `${strategy.id}_customData_recibioFlyer`, `${strategy.id}_customData_fechaUltimoContacto`, `${strategy.id}_customData_fechaSeguimiento`, `${strategy.id}_customData_observaciones`);
            LEGAL_PROCEDURES.forEach(proc => {
                const headerBase = proc.toLowerCase().replace(/\s+/g, '_');
                strategyHeaders.push(`${strategy.id}_customData_${headerBase}_status`, `${strategy.id}_customData_${headerBase}_subStatus`);
            });
        } else if (strategy.id === 'DPFI') {
             strategyHeaders.push(`${strategy.id}_customData_agendoCitaAsesoria`, `${strategy.id}_customData_fechaCitaAsesoria`, `${strategy.id}_customData_productoInteres`, `${strategy.id}_customData_fechaUltimoContacto`, `${strategy.id}_customData_numeroContacto`, `${strategy.id}_customData_recordatorioProximoContacto`, `${strategy.id}_customData_solicitoInformacionIF`, `${strategy.id}_customData_logroCredito`, `${strategy.id}_customData_institucion`, `${strategy.id}_customData_montoCredito`, `${strategy.id}_customData_observaciones`, `${strategy.id}_customData_recibioFlyer`);
        } else if (strategy.id === 'TAI') {
            strategyHeaders.push(`${strategy.id}_customData_startedConstructionWithin60Days`, `${strategy.id}_customData_notes`);
        } else if (STRATEGY_SPECIFIC_FIELDS[strategy.id]) {
            STRATEGY_SPECIFIC_FIELDS[strategy.id].forEach(field => {
                strategyHeaders.push(`${strategy.id}_customData_${field.key}`);
            });
        }
    });

    const allHeaders = [...baseHeaders, ...basicInfoHeaders, ...strategyHeaders];
    
    const csvRows = [allHeaders.join(',')];

    const sanitizeValue = (value: any): string | number | boolean => {
        if (value === undefined || value === null) {
            return '';
        }
        if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    customers.forEach(customer => {
        const row: (string | number | boolean)[] = [];

        baseHeaders.forEach(header => {
            const key = header as keyof Customer;
            let value = customer[key];
            if (Array.isArray(value)) {
                row.push(sanitizeValue(value.join(';')));
            } else {
                 row.push(sanitizeValue(value));
            }
        });

        basicInfoHeaders.forEach(header => {
            const key = header.replace('basicInfo_', '') as keyof BasicInfo;
            const value = customer.basicInfo?.[key];
            row.push(sanitizeValue(value));
        });

        STRATEGIES.forEach(strategy => {
            const customerStrategy = customer.strategies.find(s => s.strategyId === strategy.id);
            if (customerStrategy) {
                row.push(
                    sanitizeValue(customerStrategy.offered), sanitizeValue(customerStrategy.accepted), sanitizeValue(customerStrategy.status), 
                    sanitizeValue(customerStrategy.lastOfferContactDate), sanitizeValue(customerStrategy.offerComments)
                );

                if (strategy.id === 'STL') {
                    const data = customerStrategy.customData as SolidarityTitlingLoanData;
                    row.push(sanitizeValue(data?.referencia), sanitizeValue(data?.riesgo), sanitizeValue(data?.expediente), sanitizeValue(data?.montoPrestamo), sanitizeValue(data?.firmoAdenda), sanitizeValue(data?.modalidadAbono));
                    for (let i = 0; i < NUM_PAYMENTS; i++) {
                        const abono: Abono | undefined = data?.abonos?.[i];
                        row.push(sanitizeValue(abono?.realizado), sanitizeValue(abono?.cantidad), sanitizeValue(abono?.fecha), sanitizeValue(abono?.formaDePago), sanitizeValue(abono?.comprobante), sanitizeValue(abono?.validado));
                    }
                } else if (strategy.id === 'TLS') {
                    const data = customerStrategy.customData as TailoredLegalSupportData;
                    row.push(sanitizeValue(data?.contactCount), sanitizeValue(data?.recibioFlyer), sanitizeValue(data?.fechaUltimoContacto), sanitizeValue(data?.fechaSeguimiento), sanitizeValue(data?.observaciones));
                    LEGAL_PROCEDURES.forEach(proc => {
                        const procData = data?.procedureStatus?.[proc];
                        row.push(sanitizeValue(procData?.status), sanitizeValue(procData?.subStatus));
                    });
                } else if (strategy.id === 'DPFI') {
                    const data = customerStrategy.customData as DirectPromotionFIData;
                    row.push(sanitizeValue(data?.agendoCitaAsesoria), sanitizeValue(data?.fechaCitaAsesoria), sanitizeValue(data?.productoInteres), sanitizeValue(data?.fechaUltimoContacto), sanitizeValue(data?.numeroContacto), sanitizeValue(data?.recordatorioProximoContacto), sanitizeValue(data?.solicitoInformacionIF), sanitizeValue(data?.logroCredito), sanitizeValue(data?.institucion), sanitizeValue(data?.montoCredito), sanitizeValue(data?.observaciones), sanitizeValue(data?.recibioFlyer));
                } else if (strategy.id === 'TAI') {
                     const data = customerStrategy.customData as TechnicalAssistanceIncentiveData;
                     row.push(sanitizeValue(data?.startedConstructionWithin60Days), sanitizeValue(data?.notes));
                } else if (STRATEGY_SPECIFIC_FIELDS[strategy.id]) {
                    STRATEGY_SPECIFIC_FIELDS[strategy.id].forEach(field => {
                        row.push(sanitizeValue(customerStrategy.customData?.[field.key]));
                    });
                }
            } else {
                let placeholderCount = 5;
                if (strategy.id === 'STL') placeholderCount += 6 + (NUM_PAYMENTS * 6);
                else if (strategy.id === 'TLS') placeholderCount += 5 + (LEGAL_PROCEDURES.length * 2);
                else if (strategy.id === 'DPFI') placeholderCount += 12;
                else if (strategy.id === 'TAI') placeholderCount += 2;
                else if (STRATEGY_SPECIFIC_FIELDS[strategy.id]) placeholderCount += STRATEGY_SPECIFIC_FIELDS[strategy.id].length;
                
                row.push(...Array(placeholderCount).fill(''));
            }
        });
        
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `export_clientes_ahualulco_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }, [customers]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Header 
        lastSyncTime={lastSyncTime}
        loading={loading}
        onRefresh={fetchCustomers}
      />
      <main className="flex-grow overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto p-4 md:p-8">
            {selectedCustomer ? (
              <CustomerDetail
                customer={selectedCustomer}
                onBack={handleBack}
                onUpdateDetails={updateCustomerDetails}
                onUpdateStrategy={updateCustomerStrategy}
                onUpdateTask={updateTask}
                onAddTask={addTask}
                onUpdateStrategyCustomData={updateCustomerStrategyCustomData}
                onAddStrategy={addStrategyToCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onUpdateBasicInfo={updateCustomerBasicInfo}
              />
            ) : (
              <CustomerTable 
                customers={customers} 
                loading={loading}
                error={error}
                onRetry={fetchCustomers}
                onSelectCustomer={handleSelectCustomer} 
                onUpdatePotentialStrategies={updateCustomerPotentialStrategies}
                onImportCustomers={importCustomers}
                onUpdateCustomersFromCsv={updateCustomersFromCsv}
                onDeleteCustomer={handleDeleteCustomer}
                onUpdateDetails={updateCustomerDetails}
                onExportAll={handleExportAll}
              />
            )}
        </div>
      </main>
    </div>
  );
}

export default App;