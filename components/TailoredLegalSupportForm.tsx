import React from 'react';
import type { Customer, CustomerStrategy, TailoredLegalSupportData } from '../types';
import InputGroup from './InputGroup';
import { LEGAL_PROCEDURES, LEGAL_STATUS_OPTIONS, LEGAL_SUBSTATUS_OPTIONS } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';

interface TLSFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const TailoredLegalSupportForm: React.FC<TLSFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const tlsData = (customerStrategy.customData || {}) as TailoredLegalSupportData;

    if (!tlsData) {
        return <div className="text-red-500">Error: Legal support data is missing for this strategy.</div>;
    }

    const handleUpdate = (updatedData: Partial<TailoredLegalSupportData>) => {
        const newCustomData = { ...tlsData, ...updatedData };
        onUpdateStrategy(customer.id, 'TLS', { customData: newCustomData });
    };

    const handleIncrementContact = () => {
        const today = new Date();
        const nextFollowUp = new Date();
        nextFollowUp.setDate(today.getDate() + 14);

        const updatedData = {
            contactCount: (tlsData.contactCount || 0) + 1,
            fechaUltimoContacto: today.toISOString().split('T')[0],
            fechaSeguimiento: nextFollowUp.toISOString().split('T')[0],
        };

        handleUpdate(updatedData);
    };

    const handleDecrementContact = () => {
        const currentCount = tlsData.contactCount || 0;
        if (currentCount > 0) {
            handleUpdate({ contactCount: currentCount - 1 });
        }
    };


    const handleProcedureStatusChange = (procedure: string, newStatus: 'No iniciado' | 'Siendo asesorado' | 'Completado') => {
        const currentProcedureData = tlsData.procedureStatus?.[procedure] || { status: 'No iniciado', subStatus: '' };
        
        // FIX: Refactored to be more explicit and avoid type inference issues with conditional spread.
        const { subStatus: currentSubStatus } = currentProcedureData;

        const newProcedureData: NonNullable<TailoredLegalSupportData['procedureStatus']>[string] = {
            status: newStatus,
        };

        if (newStatus === 'Siendo asesorado') {
            newProcedureData.subStatus = currentSubStatus || '';
        }

        const newStatusRecord = {
            ...(tlsData.procedureStatus || {}),
            [procedure]: newProcedureData,
        };
        handleUpdate({ procedureStatus: newStatusRecord });
    };
    
    const handleProcedureSubStatusChange = (procedure: string, newSubStatus: 'Pendiente de entrega de documentación' | 'Documento en presidencia municipal' | '') => {
        const currentProcedureData = tlsData.procedureStatus?.[procedure] || { status: 'No iniciado', subStatus: '' };
        const newProcedureData = {
            ...currentProcedureData,
            subStatus: newSubStatus,
        };
        const newStatusRecord = {
            ...(tlsData.procedureStatus || {}),
            [procedure]: newProcedureData,
        };
        handleUpdate({ procedureStatus: newStatusRecord });
    };

    const firstIncompleteIndex = LEGAL_PROCEDURES.findIndex(
        proc => tlsData.procedureStatus?.[proc]?.status !== 'Completado'
    );

    const activeProcedureIndex = firstIncompleteIndex === -1 ? LEGAL_PROCEDURES.length : firstIncompleteIndex;


    return (
        <div className="space-y-6">
             <div>
                <h4 className="text-md font-semibold text-gray-700 mb-4">Progreso de Trámites</h4>
                <div className="space-y-4">
                    {LEGAL_PROCEDURES.map((procedure, index) => {
                        const procedureData = tlsData.procedureStatus?.[procedure] || { status: 'No iniciado' };
                        const status = procedureData.status;
                        const subStatus = procedureData.subStatus;

                        const isCompleted = status === 'Completado';
                        const isActive = index === activeProcedureIndex;
                        const isFuture = index > activeProcedureIndex;

                        let ringClass = 'ring-gray-300';
                        let textClass = 'text-gray-500';
                        let bgClass = 'bg-gray-50';

                        if (isCompleted) {
                            ringClass = 'ring-status-green';
                            textClass = 'text-gray-800';
                            bgClass = 'bg-green-50';
                        } else if (isActive) {
                            ringClass = 'ring-brand-primary';
                            textClass = 'font-semibold text-brand-primary';
                            bgClass = 'bg-blue-50';
                        }
                        
                        return (
                             <div key={procedure} className={`p-4 border rounded-lg transition-all ${ringClass} ${bgClass} ${isFuture ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isCompleted ? (
                                             <div className="flex items-center justify-center w-6 h-6 rounded-full bg-status-green">
                                                <CheckIcon className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold ${isActive ? 'bg-brand-primary' : 'bg-gray-400'}`}>
                                                {index + 1}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className={`text-md ${textClass}`}>{procedure}</h3>
                                            {isActive && status === 'Siendo asesorado' && subStatus && (
                                                <p className="text-xs text-brand-secondary font-medium mt-1">{subStatus}</p>
                                            )}
                                        </div>
                                    </div>
                                    <select
                                        value={status}
                                        onChange={(e) => handleProcedureStatusChange(procedure, e.target.value as any)}
                                        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={isFuture}
                                        aria-label={`Status for ${procedure}`}
                                    >
                                        {LEGAL_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                {isActive && status === 'Siendo asesorado' && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <label className="block text-sm font-medium text-gray-600 mb-1 ml-9">Sub-etapa:</label>
                                        <div className="pl-9">
                                            <select
                                            value={subStatus || ''}
                                            onChange={(e) => handleProcedureSubStatusChange(procedure, e.target.value as any)}
                                            className="text-sm border-gray-300 rounded-md shadow-sm w-full focus:ring-brand-secondary focus:border-brand-secondary"
                                            >
                                                <option value="">-- Seleccionar sub-etapa --</option>
                                                {LEGAL_SUBSTATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="pt-6 border-t">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Seguimiento de Contacto</h4>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600">Contactos registrados:</p>
                        <p className="text-2xl font-bold text-brand-primary">{tlsData.contactCount || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDecrementContact}
                            disabled={(tlsData.contactCount || 0) === 0}
                            className="p-2 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Disminuir contador de contactos"
                            title="Disminuir contador de contactos"
                        >
                            <MinusIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleIncrementContact}
                            className="p-2 text-white bg-brand-primary rounded-full hover:bg-brand-secondary transition-colors"
                            aria-label="Aumentar contador de contactos y registrar hoy"
                            title="Aumentar contador y registrar contacto hoy"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mt-4">
                    <InputGroup
                        label="Fecha Último Contacto"
                        id="fechaUltimoContacto"
                        type="date"
                        value={tlsData.fechaUltimoContacto || ''}
                        onChange={(e) => handleUpdate({ fechaUltimoContacto: e.target.value })}
                    />
                    <InputGroup
                        label="Fecha de Próximo Seguimiento"
                        id="fechaSeguimiento"
                        type="date"
                        value={tlsData.fechaSeguimiento || ''}
                        onChange={(e) => handleUpdate({ fechaSeguimiento: e.target.value })}
                    />
                    <div className="flex items-center pt-6">
                        <input
                            id="recibioFlyer"
                            type="checkbox"
                            checked={tlsData.recibioFlyer || false}
                            onChange={(e) => handleUpdate({ recibioFlyer: e.target.checked })}
                            className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"
                        />
                        <label htmlFor="recibioFlyer" className="ml-2 block text-sm text-gray-900">
                            Recibió Flyer
                        </label>
                    </div>
                </div>
            </div>
            
            <div className="mt-4">
                <InputGroup
                    label="Observaciones" id="observaciones" as="textarea" rows={3}
                    value={tlsData.observaciones || ''}
                    onChange={(e) => handleUpdate({ observaciones: e.target.value })}
                />
            </div>
        </div>
    );
};

export default TailoredLegalSupportForm;