import React from 'react';
import type { Customer, CustomerStrategy, DirectPromotionFIData } from '../types';
import InputGroup from './InputGroup';

interface DPFIFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const CheckboxGroup: React.FC<{ label: string; id: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;}> = ({ label, id, checked, onChange }) => (
    <div className="flex items-center pt-6">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
            {label}
        </label>
    </div>
);

const DirectPromotionFIForm: React.FC<DPFIFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const dpfiData = customerStrategy.customData as DirectPromotionFIData;

    if (!dpfiData) {
        return <div className="text-red-500">Error: Direct promotion data is missing for this strategy.</div>;
    }

    const handleUpdate = (updatedData: Partial<DirectPromotionFIData>) => {
        const newCustomData = { ...dpfiData, ...updatedData };
        onUpdateStrategy(customer.id, 'DPFI', { customData: newCustomData });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <InputGroup
                    label="Cita para información" id="citaInformacion" type="date"
                    value={dpfiData.citaInformacion || ''}
                    onChange={(e) => handleUpdate({ citaInformacion: e.target.value })}
                />
                 <InputGroup
                    label="Fecha Último Contacto" id="fechaUltimoContacto" type="date"
                    value={dpfiData.fechaUltimoContacto || ''}
                    onChange={(e) => handleUpdate({ fechaUltimoContacto: e.target.value })}
                />
                 <InputGroup
                    label="Institución" id="institucion"
                    value={dpfiData.institucion || ''}
                    onChange={(e) => handleUpdate({ institucion: e.target.value })}
                />
                <InputGroup
                    label="Monto del crédito" id="montoCredito" type="number"
                    value={dpfiData.montoCredito || 0}
                    onChange={(e) => handleUpdate({ montoCredito: parseFloat(e.target.value) || 0 })}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 mt-4">
                 <CheckboxGroup
                    label="Contactado" id="contactado"
                    checked={dpfiData.contactado || false}
                    onChange={(e) => handleUpdate({ contactado: e.target.checked })}
                />
                <CheckboxGroup
                    label="Recibió Flyer" id="recibioFlyer"
                    checked={dpfiData.recibioFlyer || false}
                    onChange={(e) => handleUpdate({ recibioFlyer: e.target.checked })}
                />
                <CheckboxGroup
                    label="¿Recibió asesoría?" id="recibioAsesoria"
                    checked={dpfiData.recibioAsesoria || false}
                    onChange={(e) => handleUpdate({ recibioAsesoria: e.target.checked })}
                />
                 <CheckboxGroup
                    label="¿Seguimiento?" id="seguimiento"
                    checked={dpfiData.seguimiento || false}
                    onChange={(e) => handleUpdate({ seguimiento: e.target.checked })}
                />
                 <CheckboxGroup
                    label="¿Logró crédito?" id="logroCredito"
                    checked={dpfiData.logroCredito || false}
                    onChange={(e) => handleUpdate({ logroCredito: e.target.checked })}
                />
            </div>
            
            <div className="mt-4">
                <InputGroup
                    label="Observaciones" id="observaciones" as="textarea" rows={3}
                    value={dpfiData.observaciones || ''}
                    onChange={(e) => handleUpdate({ observaciones: e.target.value })}
                />
            </div>
        </div>
    );
};

export default DirectPromotionFIForm;