import React from 'react';
import type { Customer, CustomerStrategy, TechnicalAssistanceIncentiveData } from '../types';
import InputGroup from './InputGroup';

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

interface TAIFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const TechnicalAssistanceIncentiveForm: React.FC<TAIFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const taiData = (customerStrategy.customData || { startedConstructionWithin60Days: false, notes: '' }) as TechnicalAssistanceIncentiveData;

    const handleUpdate = (updatedData: Partial<TechnicalAssistanceIncentiveData>) => {
        const newCustomData = { ...taiData, ...updatedData };
        onUpdateStrategy(customer.id, 'TAI', { customData: newCustomData });
    };

    return (
        <div className="space-y-6 bg-white p-4 rounded-lg">
            <ToggleSwitch
                label="Inició construcción <60 días (después de obtener Licencia de Construcción)"
                id="startedConstructionWithin60Days"
                checked={taiData.startedConstructionWithin60Days || false}
                onChange={(isChecked) => handleUpdate({ startedConstructionWithin60Days: isChecked })}
            />
            <InputGroup
                label="Notas"
                id="tai-notes"
                as="textarea"
                rows={4}
                value={taiData.notes || ''}
                onChange={(e) => handleUpdate({ notes: e.target.value })}
            />
        </div>
    );
};

export default TechnicalAssistanceIncentiveForm;