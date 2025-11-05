import React from 'react';
import type { Customer, CustomerStrategy, Task, BasicInfo } from '../types';
import { LegalStatus, TriStateStatus, StatusCarpetaATC } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import ProgressBar from './ProgressBar';
import StrategyAccordion from './StrategyAccordion';
import { TrashIcon } from './icons/TrashIcon';
import InputGroup from './InputGroup';
import BasicInfoSheet from './BasicInfoSheet';
import { RESPONSABLES } from '../constants';


interface CustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onUpdateDetails: (customerId: string, details: Partial<Pick<Customer, 'legalStatus' | 'manzana' | 'lote' | 'hasCredit' | 'hasSavings' | 'motivation' | 'modificacionLote' | 'contratoATC' | 'pagoATC' | 'statusCarpetaATC' | 'recordatorioEntregaCarpeta' | 'responsable' | 'startedConstruction' | 'hasTituloPropiedad' | 'hasDeslinde' | 'hasPermisoConstruccion' | 'atcAmount' | 'atcFolderDeliveryDate' | 'atcPrototype' | 'atcPrototypeType'>>) => void;
  onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
  onUpdateTask: (customerId: string, strategyId: string, taskId: string, updatedTask: Partial<Task>) => void;
  onAddTask: (customerId: string, strategyId: string, task: Omit<Task, 'id'|'isCompleted'>, detailsToMerge?: Partial<Customer>) => void;
  onUpdateStrategyCustomData: (customerId: string, strategyId: string, key: string, value: string | number | boolean) => void;
  onAddStrategy: (customerId: string, strategyId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateBasicInfo: (customerId: string, updatedInfo: Partial<BasicInfo>) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{children || value}</dd>
    </div>
);

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onBack, onUpdateDetails, onUpdateStrategy, onUpdateTask, onAddTask, onUpdateStrategyCustomData, onAddStrategy, onDeleteCustomer, onUpdateBasicInfo }) => {
  
  const handleDelete = () => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
        onDeleteCustomer(customer.id);
    }
  };
  
  const handleContratoATCChange = (isChecked: boolean) => {
    let taskAdded = false;
    if (isChecked) {
        const hasTAIStrategy = customer.strategies.some(s => s.strategyId === 'TAI');
        if (hasTAIStrategy) {
            const hasATCTask = customer.strategies
                .find(s => s.strategyId === 'TAI')?.tasks
                .some(t => t.description.includes('Asistencia Técnica'));

            if (!hasATCTask) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 7);
                const dueDate = tomorrow.toISOString().split('T')[0];

                onAddTask(customer.id, 'TAI', {
                    description: 'Realizar visita inicial de Asistencia Técnica',
                    dueDate: dueDate,
                    assignedTo: 'Equipo Técnico'
                }, { contratoATC: isChecked });
                alert('Se ha agregado una tarea de seguimiento de ATC a la estrategia de Asistencia Técnica.');
                taskAdded = true;
            }
        } else {
            alert('Para registrar tareas de ATC, primero debe activar la estrategia "Devolución de asistencia técnica" para este cliente.');
        }
    }
    
    if (!taskAdded) {
        onUpdateDetails(customer.id, { contratoATC: isChecked });
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-primary bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Volver a la Lista de Clientes
      </button>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-header-bg text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{`${customer.firstName} ${customer.paternalLastName} ${customer.maternalLastName}`}</h2>
            <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-300 font-mono">{customer.id}</p>
                <span className="text-gray-500">|</span>
                <p className="text-xs text-gray-400">
                    Última Actualización: {new Date(customer.lastUpdate).toLocaleString()}
                </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-status-red rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-red transition-colors"
            aria-label={`Delete ${customer.firstName}`}
          >
            <TrashIcon className="w-5 h-5" />
            Eliminar Cliente
          </button>
        </div>

        <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Información del Cliente</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Contacto" value={customer.contact} />
                <DetailItem label="Lotes" value={customer.lots} />
                <DetailItem label="Responsable Asignado">
                    <select
                        id="responsable"
                        value={customer.responsable || ''}
                        onChange={(e) => onUpdateDetails(customer.id, { responsable: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                        <option value="">-- No Asignado --</option>
                        {RESPONSABLES.map(email => (
                            <option key={email} value={email}>
                                {email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </DetailItem>
                <DetailItem label="Manzana">
                  <input
                      id="manzana"
                      value={customer.manzana}
                      onChange={(e) => onUpdateDetails(customer.id, { manzana: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  />
                </DetailItem>
                <DetailItem label="Lote">
                  <input
                      id="lote"
                      value={customer.lote}
                      onChange={(e) => onUpdateDetails(customer.id, { lote: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  />
                </DetailItem>
                <DetailItem label="Group" value={customer.group} />
                <DetailItem label="Estatus Legal">
                  <select
                      id="legalStatus"
                      value={customer.legalStatus}
                      onChange={(e) => onUpdateDetails(customer.id, { legalStatus: e.target.value as LegalStatus })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                  >
                      {Object.values(LegalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </DetailItem>
                <DetailItem label="Tiene Crédito">
                   <select
                        id="hasCredit"
                        value={customer.hasCredit}
                        onChange={(e) => onUpdateDetails(customer.id, { hasCredit: e.target.value as TriStateStatus })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                        {Object.values(TriStateStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </DetailItem>
                <DetailItem label="Tiene Ahorros">
                   <select
                        id="hasSavings"
                        value={customer.hasSavings}
                        onChange={(e) => onUpdateDetails(customer.id, { hasSavings: e.target.value as TriStateStatus })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                        {Object.values(TriStateStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </DetailItem>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <dt className="text-sm font-bold text-status-red">ALERTA: Modificación en superficie de lote</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex items-center space-x-2 mt-2">
                            <label className="text-sm">No</label>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="modificacionLote"
                                    className="sr-only"
                                    checked={customer.modificacionLote}
                                    onChange={(e) => onUpdateDetails(customer.id, { modificacionLote: e.target.checked })}
                                />
                                <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.modificacionLote ? 'bg-status-red' : 'bg-gray-300'}`} onClick={() => onUpdateDetails(customer.id, { modificacionLote: !customer.modificacionLote })}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.modificacionLote ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <label className="text-sm">Sí</label>
                        </div>
                    </dd>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 mt-4 pt-4 border-t">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Trámites Completados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                        <DetailItem label="Título de propiedad">
                            <div className="flex items-center space-x-2 mt-2">
                                <label className="text-sm">No</label>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="hasTituloPropiedad"
                                        className="sr-only"
                                        checked={customer.hasTituloPropiedad}
                                        onChange={(e) => onUpdateDetails(customer.id, { hasTituloPropiedad: e.target.checked })}
                                    />
                                    <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.hasTituloPropiedad ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => onUpdateDetails(customer.id, { hasTituloPropiedad: !customer.hasTituloPropiedad })}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.hasTituloPropiedad ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <label className="text-sm">Sí</label>
                            </div>
                        </DetailItem>
                        <DetailItem label="Deslinde">
                            <div className="flex items-center space-x-2 mt-2">
                                <label className="text-sm">No</label>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="hasDeslinde"
                                        className="sr-only"
                                        checked={customer.hasDeslinde}
                                        onChange={(e) => onUpdateDetails(customer.id, { hasDeslinde: e.target.checked })}
                                    />
                                    <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.hasDeslinde ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => onUpdateDetails(customer.id, { hasDeslinde: !customer.hasDeslinde })}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.hasDeslinde ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <label className="text-sm">Sí</label>
                            </div>
                        </DetailItem>
                        <DetailItem label="Permiso de construcción">
                            <div className="flex items-center space-x-2 mt-2">
                                <label className="text-sm">No</label>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="hasPermisoConstruccion"
                                        className="sr-only"
                                        checked={customer.hasPermisoConstruccion}
                                        onChange={(e) => onUpdateDetails(customer.id, { hasPermisoConstruccion: e.target.checked })}
                                    />
                                    <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.hasPermisoConstruccion ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => onUpdateDetails(customer.id, { hasPermisoConstruccion: !customer.hasPermisoConstruccion })}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.hasPermisoConstruccion ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <label className="text-sm">Sí</label>
                            </div>
                        </DetailItem>
                        <DetailItem label="Inició Construcción">
                            <div className="flex items-center h-full mt-2">
                                <input
                                    type="checkbox"
                                    id="startedConstruction"
                                    checked={customer.startedConstruction}
                                    onChange={(e) => onUpdateDetails(customer.id, { startedConstruction: e.target.checked })}
                                    className="h-5 w-5 text-brand-primary focus:ring-brand-light border-gray-300 rounded"
                                />
                                <label htmlFor="startedConstruction" className="ml-2 text-sm text-gray-700">
                                    Marcar como iniciado
                                </label>
                            </div>
                        </DetailItem>
                    </div>
                </div>

                <DetailItem label="Camino a la construcción (%)">
                    <div className="mt-2">
                        <ProgressBar percentage={customer.pathwayToTitling} />
                    </div>
                </DetailItem>
                <div className="sm:col-span-2 lg:col-span-3">
                    <InputGroup
                        label="Motivación para Construir"
                        id="motivation"
                        as="textarea"
                        rows={2}
                        value={customer.motivation}
                        onChange={(e) => onUpdateDetails(customer.id, { motivation: e.target.value })}
                    />
                </div>
            </dl>
        </div>
      </div>

      <BasicInfoSheet 
        customer={customer}
        onUpdate={(updatedInfo) => onUpdateBasicInfo(customer.id, updatedInfo)}
      />

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Asistencia Técnica</h3>
            <p className="text-gray-500 mt-1">Gestionar el proceso de Asistencia Técnica para Construcción (ATC).</p>
        </div>
        <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Contrató Servicio de ATC">
                    <div className="flex items-center space-x-2 mt-2">
                        <label className="text-sm">No</label>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="contratoATC"
                                className="sr-only"
                                checked={customer.contratoATC}
                                onChange={(e) => handleContratoATCChange(e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.contratoATC ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => handleContratoATCChange(!customer.contratoATC)}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.contratoATC ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <label className="text-sm">Sí</label>
                    </div>
                </DetailItem>
            </dl>
            {customer.contratoATC && (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 mt-6 pt-6 border-t">
                    <DetailItem label="Pagó ATC">
                        <div className="flex items-center space-x-2 mt-2">
                            <label className="text-sm">No</label>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="pagoATC"
                                    className="sr-only"
                                    checked={customer.pagoATC}
                                    onChange={(e) => onUpdateDetails(customer.id, { pagoATC: e.target.checked })}
                                />
                                <div className={`block w-10 h-6 rounded-full cursor-pointer ${customer.pagoATC ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => onUpdateDetails(customer.id, { pagoATC: !customer.pagoATC })}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${customer.pagoATC ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <label className="text-sm">Sí</label>
                        </div>
                    </DetailItem>
                    <InputGroup
                        label="Cantidad ($)"
                        id="atcAmount"
                        type="number"
                        value={customer.atcAmount || ''}
                        onChange={(e) => onUpdateDetails(customer.id, { atcAmount: parseFloat(e.target.value) || 0 })}
                    />
                    <DetailItem label="Status de Carpeta">
                        <select
                            id="statusCarpetaATC"
                            value={customer.statusCarpetaATC}
                            onChange={(e) => onUpdateDetails(customer.id, { statusCarpetaATC: e.target.value as StatusCarpetaATC })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            {Object.values(StatusCarpetaATC).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </DetailItem>
                    <InputGroup
                        label="Fecha de entrega de carpeta"
                        id="atcFolderDeliveryDate"
                        type="date"
                        value={customer.atcFolderDeliveryDate || ''}
                        onChange={(e) => onUpdateDetails(customer.id, { atcFolderDeliveryDate: e.target.value })}
                    />
                    <InputGroup
                        label="Recordatorio entrega de carpeta"
                        id="recordatorioEntregaCarpeta"
                        type="date"
                        value={customer.recordatorioEntregaCarpeta}
                        onChange={(e) => onUpdateDetails(customer.id, { recordatorioEntregaCarpeta: e.target.value })}
                    />
                     <DetailItem label="Prototipo seleccionado">
                        <select
                            id="atcPrototype"
                            value={customer.atcPrototype || ''}
                            onChange={(e) => onUpdateDetails(customer.id, { atcPrototype: parseInt(e.target.value, 10) })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            <option value="">-- Seleccionar --</option>
                            {[...Array(8).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                    </DetailItem>
                    <DetailItem label="Tipo">
                        <select
                            id="atcPrototypeType"
                            value={customer.atcPrototypeType || ''}
                            onChange={(e) => onUpdateDetails(customer.id, { atcPrototypeType: e.target.value as 'Moderno' | 'Tradicional' })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="Moderno">Moderno</option>
                            <option value="Tradicional">Tradicional</option>
                        </select>
                    </DetailItem>
                </dl>
            )}
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Estrategias para la Construcción</h3>
            <p className="text-gray-500 mt-1">Gestionar la participación y las acciones de seguimiento para cada estrategia.</p>
        </div>
        <div className="p-6 space-y-4">
           <StrategyAccordion 
             customer={customer} 
             onUpdateStrategy={onUpdateStrategy} 
             onUpdateTask={onUpdateTask}
             onAddTask={onAddTask}
             onUpdateStrategyCustomData={onUpdateStrategyCustomData}
             onAddStrategy={onAddStrategy}
           />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;