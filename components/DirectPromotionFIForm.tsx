import React from 'react';
import type { Customer, CustomerStrategy, DirectPromotionFIData } from '../types';
import InputGroup from './InputGroup';
import { PRODUCTO_INTERES_DPFI } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';

interface DPFIFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const ToggleSwitch: React.FC<{ label: string; id: string; checked: boolean; onChange: (isChecked: boolean) => void;}> = ({ label, id, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
            {label}
        </label>
        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
             <input
                type="checkbox"
                id={id}
                className="sr-only"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className={`block w-10 h-6 rounded-full cursor-pointer ${checked ? 'bg-brand-primary' : 'bg-gray-300'}`} onClick={() => onChange(!checked)}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </div>
);

const DirectPromotionFIForm: React.FC<DPFIFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const dpfiData = (customerStrategy.customData || {}) as DirectPromotionFIData;

    if (!dpfiData) {
        return <div className="text-red-500">Error: Direct promotion data is missing for this strategy.</div>;
    }

    const handleUpdate = (updatedData: Partial<DirectPromotionFIData>) => {
        const newCustomData = { ...dpfiData, ...updatedData };
        onUpdateStrategy(customer.id, 'DPFI', { customData: newCustomData });
    };

    const handleIncrementContact = () => {
        const today = new Date();
        const nextFollowUp = new Date();
        nextFollowUp.setDate(today.getDate() + 14);

        const updatedData = {
            numeroContacto: (dpfiData.numeroContacto || 0) + 1,
            fechaUltimoContacto: today.toISOString().split('T')[0],
            recordatorioProximoContacto: nextFollowUp.toISOString().split('T')[0],
        };
        handleUpdate(updatedData);
    };

    const handleDecrementContact = () => {
        const currentCount = dpfiData.numeroContacto || 0;
        if (currentCount > 0) {
            handleUpdate({ numeroContacto: currentCount - 1 });
        }
    };

    return (
        <div className="space-y-8">
            {/* Asesoría New Story Section */}
            <div className="p-4 border rounded-lg bg-white">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Asesoría New Story</h4>
                <div className="space-y-4">
                     <ToggleSwitch
                        label="Agendó cita para asesoría"
                        id="agendoCitaAsesoria"
                        checked={dpfiData.agendoCitaAsesoria || false}
                        onChange={(isChecked) => handleUpdate({ agendoCitaAsesoria: isChecked })}
                    />
                    {dpfiData.agendoCitaAsesoria && (
                        <InputGroup
                            label="Fecha de la Cita" id="fechaCitaAsesoria" type="date"
                            value={dpfiData.fechaCitaAsesoria || ''}
                            onChange={(e) => handleUpdate({ fechaCitaAsesoria: e.target.value })}
                        />
                    )}
                    <InputGroup label="Producto de interés" id="productoInteres">
                        <select
                            id="productoInteres"
                            value={dpfiData.productoInteres || ''}
                            onChange={(e) => handleUpdate({ productoInteres: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        >
                            <option value="">-- Seleccionar producto --</option>
                            {PRODUCTO_INTERES_DPFI.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </InputGroup>
                    
                    <div className="pt-4">
                        <h5 className="text-md font-semibold text-gray-700 mb-2">Seguimiento de Contacto</h5>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-600">Contactos registrados:</p>
                                <p className="text-2xl font-bold text-brand-primary">{dpfiData.numeroContacto || 0}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDecrementContact}
                                    disabled={(dpfiData.numeroContacto || 0) === 0}
                                    className="p-2 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Disminuir contador de contactos"
                                >
                                    <MinusIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleIncrementContact}
                                    className="p-2 text-white bg-brand-primary rounded-full hover:bg-brand-secondary transition-colors"
                                    aria-label="Aumentar contador de contactos y registrar hoy"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mt-4">
                             <InputGroup
                                label="Fecha último contacto" id="fechaUltimoContacto" type="date"
                                value={dpfiData.fechaUltimoContacto || ''}
                                onChange={(e) => handleUpdate({ fechaUltimoContacto: e.target.value })}
                            />
                            <InputGroup
                                label="Recordatorio proximo contacto" id="recordatorioProximoContacto" type="date"
                                value={dpfiData.recordatorioProximoContacto || ''}
                                onChange={(e) => handleUpdate({ recordatorioProximoContacto: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Resultado estrategia Section */}
             <div className="p-4 border rounded-lg bg-white">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Resultado estrategia</h4>
                <div className="space-y-4">
                    <ToggleSwitch
                        label="Solicitó información en Institución Financiera"
                        id="solicitoInformacionIF"
                        checked={dpfiData.solicitoInformacionIF || false}
                        onChange={(isChecked) => handleUpdate({ solicitoInformacionIF: isChecked })}
                    />
                    <ToggleSwitch
                        label="Accedió a producto financiero"
                        id="logroCredito"
                        checked={dpfiData.logroCredito || false}
                        onChange={(isChecked) => handleUpdate({ logroCredito: isChecked })}
                    />
                    {dpfiData.logroCredito && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                            <InputGroup
                                label="Institución" id="institucion"
                                value={dpfiData.institucion || ''}
                                onChange={(e) => handleUpdate({ institucion: e.target.value })}
                            />
                            <InputGroup
                                label="Monto" id="montoCredito" type="number"
                                value={dpfiData.montoCredito || ''}
                                onChange={(e) => handleUpdate({ montoCredito: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <InputGroup
                    label="Observaciones Generales" id="observaciones" as="textarea" rows={3}
                    value={dpfiData.observaciones || ''}
                    onChange={(e) => handleUpdate({ observaciones: e.target.value })}
                />
            </div>
        </div>
    );
};

export default DirectPromotionFIForm;