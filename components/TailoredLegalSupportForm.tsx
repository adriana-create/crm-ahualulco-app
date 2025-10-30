import React from 'react';
import type { Customer, CustomerStrategy, TailoredLegalSupportData } from '../types';
import InputGroup from './InputGroup';

interface TLSFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const LEGAL_PROCEDURE_ORDER = ["Título de propiedad", "Deslinde", "Permiso de construcción", "Inicio de construcción"];
const LEGAL_STATUS_OPTIONS = ["No iniciado", "Documentos entregados", "En proceso", "Completado"];

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

const TailoredLegalSupportForm: React.FC<TLSFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const tlsData = customerStrategy.customData as TailoredLegalSupportData;

    if (!tlsData) {
        return <div className="text-red-500">Error: Legal support data is missing for this strategy.</div>;
    }

    const handleUpdate = (updatedData: Partial<TailoredLegalSupportData>) => {
        const newCustomData = { ...tlsData, ...updatedData };
        onUpdateStrategy(customer.id, 'TLS', { customData: newCustomData });
    };

    const handleTramiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTramite = e.target.value;
        const currentIndex = LEGAL_PROCEDURE_ORDER.indexOf(newTramite);
        
        let tramiteAnterior = "N/A";
        let siguienteTramite = "N/a";

        if (currentIndex !== -1) {
            tramiteAnterior = currentIndex > 0 ? LEGAL_PROCEDURE_ORDER[currentIndex - 1] : "N/A";
            siguienteTramite = currentIndex < LEGAL_PROCEDURE_ORDER.length - 1 ? LEGAL_PROCEDURE_ORDER[currentIndex + 1] : "N/A";
        }

        handleUpdate({
            tramiteActual: newTramite,
            tramiteAnterior,
            siguienteTramite,
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <InputGroup label="Trámite Actual (Asesorado)" id="tramiteActual">
                     <select
                        id="tramiteActual"
                        value={tlsData.tramiteActual || ''}
                        onChange={handleTramiteChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    >
                        <option value="">-- Seleccionar --</option>
                        {LEGAL_PROCEDURE_ORDER.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                </InputGroup>
                <InputGroup label="Estatus del Trámite Actual" id="estatusTramite">
                    <select
                        id="estatusTramite"
                        value={tlsData.estatusTramite || ''}
                        onChange={(e) => handleUpdate({ estatusTramite: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    >
                        <option value="">-- Seleccionar --</option>
                        {LEGAL_STATUS_OPTIONS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                </InputGroup>
                <InputGroup
                    label="Trámite anterior (completado)" id="tramiteAnterior"
                    value={tlsData.tramiteAnterior || ''}
                    disabled={true}
                />
                <InputGroup
                    label="Siguiente Trámite (a completar)" id="siguienteTramite"
                    value={tlsData.siguienteTramite || ''}
                    disabled={true}
                />
                 <InputGroup
                    label="Fecha Último Contacto" id="fechaUltimoContacto" type="date"
                    value={tlsData.fechaUltimoContacto || ''}
                    onChange={(e) => handleUpdate({ fechaUltimoContacto: e.target.value })}
                />
                 <InputGroup
                    label="Fecha de seguimiento (Sugerida)" id="fechaSeguimiento" type="date"
                    value={tlsData.fechaSeguimiento || ''}
                    onChange={(e) => handleUpdate({ fechaSeguimiento: e.target.value })}
                />
                 <div />
                 <CheckboxGroup
                    label="Enviar recordatorio por correo" id="enviarRecordatorio"
                    checked={tlsData.enviarRecordatorio || false}
                    onChange={(e) => handleUpdate({ enviarRecordatorio: e.target.checked })}
                />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <CheckboxGroup
                    label="Contactado" id="contactado"
                    checked={tlsData.contactado || false}
                    onChange={(e) => handleUpdate({ contactado: e.target.checked })}
                />
                <CheckboxGroup
                    label="Recibió Flyer" id="recibioFlyer"
                    checked={tlsData.recibioFlyer || false}
                    onChange={(e) => handleUpdate({ recibioFlyer: e.target.checked })}
                />
                <CheckboxGroup
                    label="Recibió asesoría" id="recibioAsesoria"
                    checked={tlsData.recibioAsesoria || false}
                    onChange={(e) => handleUpdate({ recibioAsesoria: e.target.checked })}
                />
                 <CheckboxGroup
                    label="¿Seguimiento Realizado?" id="seguimientoRealizado"
                    checked={tlsData.seguimientoRealizado || false}
                    onChange={(e) => handleUpdate({ seguimientoRealizado: e.target.checked })}
                />
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