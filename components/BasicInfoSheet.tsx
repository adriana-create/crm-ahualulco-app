import React, { useState } from 'react';
import type { Customer, BasicInfo } from '../types';
import { Gender, MaritalStatus, HousingType, ResidencyTime, Occupation, MonthlyIncome, Dependents, HousingSupportInterest, ImprovementType, PreferredContact } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PencilIcon } from './icons/PencilIcon';
import InputGroup from './InputGroup';
import RadioGroup from './RadioGroup';


interface BasicInfoSheetProps {
    customer: Customer;
    onUpdate: (updatedInfo: Partial<BasicInfo>) => void;
}

interface AccordionSectionProps {
    id: string;
    title: string;
    subtitle: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ id, title, subtitle, isOpen, onToggle, children }) => (
    <div className="border border-gray-200 rounded-lg">
        <button
            onClick={() => onToggle(id)}
            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none"
            aria-expanded={isOpen}
            aria-controls={`section-content-${id}`}
        >
            <div className="flex items-center gap-3">
                <div className="bg-brand-light/10 text-brand-primary p-2 rounded-full">
                    <PencilIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-semibold text-brand-primary">{title}</h4>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div id={`section-content-${id}`} className="p-6 border-t border-gray-200 bg-gray-50/50">
                {children}
            </div>
        )}
    </div>
);

const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '---';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '---';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 0 ? `${age} años` : '---';
};


const BasicInfoSheet: React.FC<BasicInfoSheetProps> = ({ customer, onUpdate }) => {
    const [openSection, setOpenSection] = useState<string | null>('A');
    const basicInfo = customer.basicInfo || {};

    const handleToggle = (id: string) => {
        setOpenSection(prevId => prevId === id ? null : id);
    };
    
    const handleRadioUpdate = (key: keyof BasicInfo, value: any) => {
        onUpdate({ [key]: value });
    };
    
    const handleYesNoUpdate = (key: keyof BasicInfo, value: string) => {
         onUpdate({ [key]: value === 'Sí' });
    }

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Ficha Básica de Información</h3>
                <p className="text-gray-500 mt-1">Información demográfica y socioeconómica del participante.</p>
            </div>
            <div className="p-6 space-y-3">
                <AccordionSection id="A" title="A. IDENTIFICACIÓN BÁSICA" subtitle="Datos personales y de contacto." isOpen={openSection === 'A'} onToggle={handleToggle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-end gap-4">
                            <InputGroup label="Fecha de nacimiento" id="birthDate" type="date" value={basicInfo.birthDate} onChange={e => onUpdate({ birthDate: e.target.value })} />
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Edad</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{calculateAge(basicInfo.birthDate || '')}</dd>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                          <RadioGroup legend="Sexo" name="gender" options={Object.values(Gender)} selectedValue={basicInfo.gender} onChange={(value) => handleRadioUpdate('gender', value as Gender)} orientation="horizontal" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <RadioGroup legend="Estado civil" name="maritalStatus" options={Object.values(MaritalStatus)} selectedValue={basicInfo.maritalStatus} onChange={(value) => handleRadioUpdate('maritalStatus', value as MaritalStatus)} orientation="horizontal" />
                        </div>
                        <InputGroup label="CURP" id="curp" value={basicInfo.curp} onChange={e => onUpdate({ curp: e.target.value })} />
                        <h4 className="md:col-span-2 lg:col-span-3 text-md font-semibold text-gray-700 mt-2 pt-4 border-t">Domicilio actual</h4>
                        <InputGroup label="Municipio" id="addressMunicipality" value={basicInfo.addressMunicipality} onChange={e => onUpdate({ addressMunicipality: e.target.value })} />
                        <InputGroup label="Localidad / Colonia" id="addressColonia" value={basicInfo.addressColonia} onChange={e => onUpdate({ addressColonia: e.target.value })} />
                        <InputGroup label="Calle y número" id="addressStreet" value={basicInfo.addressStreet} onChange={e => onUpdate({ addressStreet: e.target.value })} />
                        <InputGroup label="Código postal" id="addressPostalCode" value={basicInfo.addressPostalCode} onChange={e => onUpdate({ addressPostalCode: e.target.value })} />
                        <InputGroup label="Teléfono alterno o de familiar" id="alternatePhone" value={basicInfo.alternatePhone} onChange={e => onUpdate({ alternatePhone: e.target.value })} />
                    </div>
                </AccordionSection>

                <AccordionSection id="B" title="B. SITUACIÓN HABITACIONAL" subtitle="Información sobre la vivienda actual." isOpen={openSection === 'B'} onToggle={handleToggle}>
                    <div className="space-y-6">
                        <RadioGroup legend="Tipo de vivienda actual" name="housingType" options={Object.values(HousingType)} selectedValue={basicInfo.housingType} onChange={(value) => handleRadioUpdate('housingType', value as HousingType)} />
                        <RadioGroup legend="Tiempo de residencia" name="residencyTime" options={Object.values(ResidencyTime)} selectedValue={basicInfo.residencyTime} onChange={(value) => handleRadioUpdate('residencyTime', value as ResidencyTime)} orientation="horizontal" />
                        <RadioGroup legend="¿Tiene alguna otra propiedad?" name="hasOtherProperty" options={['Sí', 'No']} selectedValue={basicInfo.hasOtherProperty ? 'Sí' : basicInfo.hasOtherProperty === false ? 'No' : undefined} onChange={(value) => handleYesNoUpdate('hasOtherProperty', value)} orientation="horizontal" />
                    </div>
                </AccordionSection>
                
                <AccordionSection id="C" title="C. SITUACIÓN ECONÓMICA" subtitle="Actividad económica e ingresos del hogar." isOpen={openSection === 'C'} onToggle={handleToggle}>
                     <div className="space-y-6">
                        <div>
                            <RadioGroup legend="Ocupación o actividad principal" name="occupation" options={Object.values(Occupation)} selectedValue={basicInfo.occupation} onChange={(value) => handleRadioUpdate('occupation', value as Occupation)} />
                            {basicInfo.occupation === Occupation.Other && (
                                <InputGroup label="Especificar otra ocupación" id="occupationOther" value={basicInfo.occupationOther} onChange={e => onUpdate({ occupationOther: e.target.value })} />
                            )}
                        </div>
                        <RadioGroup legend="Ingreso mensual aproximado" name="monthlyIncome" options={Object.values(MonthlyIncome)} selectedValue={basicInfo.monthlyIncome} onChange={(value) => handleRadioUpdate('monthlyIncome', value as MonthlyIncome)} />
                        <RadioGroup legend="Dependientes económicos" name="dependents" options={Object.values(Dependents)} selectedValue={basicInfo.dependents} onChange={(value) => handleRadioUpdate('dependents', value as Dependents)} orientation="horizontal" />
                        <div>
                             <RadioGroup legend="¿Cuenta con algún crédito o ahorro previo?" name="hasCreditOrSavings" options={['Sí', 'No']} selectedValue={basicInfo.hasCreditOrSavings ? 'Sí' : basicInfo.hasCreditOrSavings === false ? 'No' : undefined} onChange={(value) => handleYesNoUpdate('hasCreditOrSavings', value)} orientation="horizontal" />
                            {basicInfo.hasCreditOrSavings && (
                                 <InputGroup label="Especificar tipo o institución" id="creditOrSavingsInfo" value={basicInfo.creditOrSavingsInfo} onChange={e => onUpdate({ creditOrSavingsInfo: e.target.value })} />
                            )}
                        </div>
                        <div>
                            <RadioGroup legend="¿Pertenece a alguna caja de ahorro, cooperativa o grupo de apoyo financiero?" name="belongsToSavingsGroup" options={['Sí', 'No']} selectedValue={basicInfo.belongsToSavingsGroup ? 'Sí' : basicInfo.belongsToSavingsGroup === false ? 'No' : undefined} onChange={(value) => handleYesNoUpdate('belongsToSavingsGroup', value)} orientation="horizontal" />
                            {basicInfo.belongsToSavingsGroup && (
                                <InputGroup label="Nombre del grupo o institución" id="savingsGroupInfo" value={basicInfo.savingsGroupInfo} onChange={e => onUpdate({ savingsGroupInfo: e.target.value })} />
                            )}
                        </div>
                     </div>
                </AccordionSection>

                <AccordionSection id="D" title="D. PARA VINCULACIÓN Y ACOMPAÑAMIENTO" subtitle="Intereses y preferencias para el seguimiento." isOpen={openSection === 'D'} onToggle={handleToggle}>
                    <div className="space-y-6">
                         <RadioGroup legend="¿Está interesada/o en recibir asesoría o apoyo para acceder a un crédito o programa de vivienda?" name="wantsHousingSupport" options={Object.values(HousingSupportInterest)} selectedValue={basicInfo.wantsHousingSupport} onChange={(value) => handleRadioUpdate('wantsHousingSupport', value as HousingSupportInterest)} />
                         <div>
                            <RadioGroup legend="¿Qué tipo de mejora o construcción desea realizar?" name="improvementType" options={Object.values(ImprovementType)} selectedValue={basicInfo.improvementType} onChange={(value) => handleRadioUpdate('improvementType', value as ImprovementType)} />
                            {basicInfo.improvementType === ImprovementType.Other && (
                                <InputGroup label="Especificar otro tipo de mejora" id="improvementTypeOther" value={basicInfo.improvementTypeOther} onChange={e => onUpdate({ improvementTypeOther: e.target.value })} />
                            )}
                         </div>
                         <RadioGroup legend="Medio de contacto preferido" name="preferredContactMethod" options={Object.values(PreferredContact)} selectedValue={basicInfo.preferredContactMethod} onChange={(value) => handleRadioUpdate('preferredContactMethod', value as PreferredContact)} orientation="horizontal" />
                         <InputGroup label="Observaciones del promotor (uso interno)" id="promoterObservations" as="textarea" rows={3} value={basicInfo.promoterObservations} onChange={e => onUpdate({ promoterObservations: e.target.value })} />
                    </div>
                </AccordionSection>
            </div>
        </div>
    );
};

export default BasicInfoSheet;
