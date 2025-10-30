import React, { useState } from 'react';
import type { Customer, CustomerStrategy, Task } from '../types';
import { StrategyStatus } from '../types';
import { STRATEGIES, STRATEGY_SPECIFIC_FIELDS, RESPONSABLES } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PlusIcon } from './icons/PlusIcon';
import TaskModal from './TaskModal';
import SolidarityTitlingLoanForm from './SolidarityTitlingLoanForm';
import TailoredLegalSupportForm from './TailoredLegalSupportForm';
import DirectPromotionFIForm from './DirectPromotionFIForm';
import InputGroup from './InputGroup';

interface StrategyAccordionProps {
  customer: Customer;
  onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
  onUpdateTask: (customerId: string, strategyId: string, taskId: string, updatedTask: Partial<Task>) => void;
  onAddTask: (customerId: string, strategyId: string, task: Omit<Task, 'id'|'isCompleted'>, detailsToMerge?: Partial<Customer>) => void;
  onUpdateStrategyCustomData: (customerId: string, strategyId: string, key: string, value: string | number | boolean) => void;
  onAddStrategy: (customerId: string, strategyId: string) => void;
}

const StrategyAccordion: React.FC<StrategyAccordionProps> = ({ customer, onUpdateStrategy, onUpdateTask, onAddTask, onUpdateStrategyCustomData, onAddStrategy }) => {
    const [openStrategyId, setOpenStrategyId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStrategyId, setModalStrategyId] = useState<string | null>(null);

    const toggleStrategy = (strategyId: string) => {
        setOpenStrategyId(prevId => (prevId === strategyId ? null : strategyId));
    };

    const handleOpenModal = (strategyId: string) => {
        setModalStrategyId(strategyId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalStrategyId(null);
    };

    const handleAddTask = (task: Omit<Task, 'id'|'isCompleted'>) => {
        if(modalStrategyId) {
            onAddTask(customer.id, modalStrategyId, task);
        }
    };
    
    const allPossibleStrategies = STRATEGIES.filter(s => {
        if (s.id === 'TAI') {
            return customer.contratoATC;
        }
        return true;
    });

    const potentialAndActiveIds = new Set([...customer.potentialStrategies, ...customer.strategies.map(s => s.strategyId)]);
    
    const relevantStrategies = STRATEGIES.filter(s => potentialAndActiveIds.has(s.id));


    if (relevantStrategies.length === 0) {
        return <p className="text-center text-gray-500 italic py-4">No hay estrategias potenciales o activas para este cliente. Puede asignarlas desde la tabla principal.</p>;
    }


    return (
        <div className="space-y-3">
            {relevantStrategies.map((strategyInfo) => {
                const custStrategy = customer.strategies.find(cs => cs.strategyId === strategyInfo.id);

                if (!custStrategy) {
                    const isTAI = strategyInfo.id === 'TAI';
                    const canActivate = isTAI ? customer.contratoATC : true;
                    return (
                        <div key={strategyInfo.id} className="border border-dashed border-gray-300 rounded-lg p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div>
                                <h4 className="font-semibold text-gray-700">{strategyInfo.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{strategyInfo.description}</p>
                                {!canActivate && isTAI && (
                                    <p className="text-xs text-status-yellow mt-2 font-semibold bg-yellow-100 p-1 rounded">
                                        Requiere que "Contrató Servicio de ATC" sea "Sí" para activar.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onAddStrategy(customer.id, strategyInfo.id)}
                                disabled={!canActivate}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-md hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Activar Seguimiento
                            </button>
                        </div>
                    );
                }

                const isOpen = openStrategyId === strategyInfo.id;
                const specificFields = STRATEGY_SPECIFIC_FIELDS[strategyInfo.id];
                const isSTL = strategyInfo.id === 'STL';
                const isTLS = strategyInfo.id === 'TLS';
                const isDPFI = strategyInfo.id === 'DPFI';
                
                return (
                    <div key={strategyInfo.id} className="border border-gray-200 rounded-lg">
                        <button
                            onClick={() => toggleStrategy(strategyInfo.id)}
                            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none"
                        >
                            <div className="flex items-center">
                                <span className="font-semibold text-brand-primary">{strategyInfo.name}</span>
                                <span className="ml-4 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">{custStrategy.status}</span>
                            </div>
                           <div className="flex items-center gap-4">
                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                           </div>
                        </button>
                        {isOpen && (
                             <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between pb-4">
                                    <span className="font-medium text-gray-700">¿Estrategia Ofertada?</span>
                                    <label htmlFor={`offered-${strategyInfo.id}`} className="flex items-center cursor-pointer">
                                        <span className="mr-3 text-sm">{custStrategy.offered ? 'Sí' : 'No'}</span>
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                id={`offered-${strategyInfo.id}`}
                                                className="sr-only" 
                                                checked={!!custStrategy.offered}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onUpdateStrategy(customer.id, strategyInfo.id, { offered: e.target.checked });
                                                }}
                                            />
                                            <div className={`block w-10 h-6 rounded-full ${custStrategy.offered ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${custStrategy.offered ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>

                                {custStrategy.offered && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-md font-semibold text-gray-700 mb-2">Detalles de la Oferta</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputGroup
                                                label="Fecha de último contacto"
                                                id={`offer-date-${strategyInfo.id}`}
                                                type="date"
                                                value={custStrategy.lastOfferContactDate || ''}
                                                onChange={(e) => onUpdateStrategy(customer.id, strategyInfo.id, { lastOfferContactDate: e.target.value })}
                                            />
                                            <InputGroup label="Responsable del contacto" id={`offer-resp-${strategyInfo.id}`}>
                                                <select
                                                    id={`offer-resp-${strategyInfo.id}`}
                                                    value={custStrategy.offerContactResponsible || ''}
                                                    onChange={(e) => onUpdateStrategy(customer.id, strategyInfo.id, { offerContactResponsible: e.target.value })}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {RESPONSABLES.map(r => <option key={r} value={r}>{r.split('@')[0]}</option>)}
                                                </select>
                                            </InputGroup>
                                            <div className="md:col-span-2">
                                                <InputGroup
                                                    label="Comentarios"
                                                    id={`offer-comments-${strategyInfo.id}`}
                                                    as="textarea"
                                                    rows={2}
                                                    value={custStrategy.offerComments || ''}
                                                    onChange={(e) => onUpdateStrategy(customer.id, strategyInfo.id, { offerComments: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                            <span className="font-medium text-gray-700">¿Cliente Aceptó?</span>
                                            <label htmlFor={`accept-${strategyInfo.id}`} className="flex items-center cursor-pointer">
                                                <span className="mr-3 text-sm">{custStrategy.accepted ? 'Sí' : 'No'}</span>
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`accept-${strategyInfo.id}`}
                                                        className="sr-only" 
                                                        checked={custStrategy.accepted}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateStrategy(customer.id, strategyInfo.id, { accepted: e.target.checked });
                                                        }}
                                                    />
                                                    <div className={`block w-10 h-6 rounded-full ${custStrategy.accepted ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${custStrategy.accepted ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        {custStrategy.accepted && (
                                            <div className="pt-4 mt-4 border-t">
                                                {isSTL ? (
                                                    <SolidarityTitlingLoanForm 
                                                        customer={customer}
                                                        customerStrategy={custStrategy}
                                                        onUpdateStrategy={onUpdateStrategy}
                                                    />
                                                ) : isTLS ? (
                                                    <TailoredLegalSupportForm
                                                        customer={customer}
                                                        customerStrategy={custStrategy}
                                                        onUpdateStrategy={onUpdateStrategy}
                                                    />
                                                ) : isDPFI ? (
                                                    <DirectPromotionFIForm
                                                        customer={customer}
                                                        customerStrategy={custStrategy}
                                                        onUpdateStrategy={onUpdateStrategy}
                                                    />
                                                ) : (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Estatus (Automático)</label>
                                                            <p className="mt-1 text-sm font-semibold text-gray-900 bg-gray-200 px-3 py-2 rounded-md">{custStrategy.status}</p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Última actualización: {new Date(custStrategy.lastUpdate).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`status-override-${strategyInfo.id}`} className="block text-sm font-medium text-gray-700">Acción Manual</label>
                                                            <select
                                                                id={`status-override-${strategyInfo.id}`}
                                                                value={custStrategy.status}
                                                                onChange={(e) => onUpdateStrategy(customer.id, strategyInfo.id, { status: e.target.value as StrategyStatus })}
                                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                                                            >
                                                                <option value={custStrategy.status}>-- {custStrategy.status} --</option>
                                                                <option value={StrategyStatus.OnHold}>Poner en Pausa</option>
                                                                <option value={StrategyStatus.Rejected}>Marcar como Rechazado</option>
                                                                {(custStrategy.status === StrategyStatus.OnHold || custStrategy.status === StrategyStatus.Rejected) &&
                                                                    <option value={StrategyStatus.InProgress}>Reactivar / Quitar Pausa</option>
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {specificFields && specificFields.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <h4 className="text-md font-semibold text-gray-700 mb-2">Detalles Específicos de la Estrategia</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {specificFields.map(field => (
                                                                    <div key={field.key}>
                                                                        <label htmlFor={`${strategyInfo.id}-${field.key}`} className="block text-sm font-medium text-gray-700">
                                                                            {field.label}
                                                                        </label>
                                                                        <input
                                                                            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                                                            id={`${strategyInfo.id}-${field.key}`}
                                                                            value={String(custStrategy.customData?.[field.key] ?? '')}
                                                                            onChange={(e) => {
                                                                                let value: string | number = e.target.value;
                                                                                if (field.type === 'number') {
                                                                                    value = parseFloat(e.target.value) || 0;
                                                                                }
                                                                                onUpdateStrategyCustomData(customer.id, strategyInfo.id, field.key, value);
                                                                            }}
                                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                                )}

                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-md font-semibold text-gray-700">Tareas</h4>
                                                        <button onClick={() => handleOpenModal(strategyInfo.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-primary border border-transparent rounded-md hover:bg-brand-secondary focus:outline-none">
                                                        <PlusIcon className="w-4 h-4"/> Agregar Tarea
                                                        </button>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {custStrategy.tasks.length > 0 ? custStrategy.tasks.map(task => (
                                                            <li key={task.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
                                                                <div className="flex items-center">
                                                                    <button onClick={() => onUpdateTask(customer.id, strategyInfo.id, task.id, { isCompleted: !task.isCompleted })} className="mr-3">
                                                                    {task.isCompleted ? <CheckCircleIcon className="w-6 h-6 text-status-green" /> : <ClockIcon className="w-6 h-6 text-status-yellow" />}
                                                                    </button>
                                                                    <div>
                                                                        <p className={`text-sm ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.description}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Vence: {new Date(task.dueDate).toLocaleDateString()} | Asignado a: {task.assignedTo}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )) : <p className="text-sm text-gray-500 text-center py-4">Aún no hay tareas para esta estrategia.</p>}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
             {isModalOpen && modalStrategyId && (
                <TaskModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onAddTask={handleAddTask}
                />
            )}
        </div>
    );
};

export default StrategyAccordion;