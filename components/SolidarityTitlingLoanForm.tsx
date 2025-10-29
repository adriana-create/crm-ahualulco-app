import React from 'react';
import type { Customer, CustomerStrategy, SolidarityTitlingLoanData, Abono } from '../types';
import InputGroup from './InputGroup';

const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 10.5z" />
  </svg>
);


interface STLFormProps {
    customer: Customer;
    customerStrategy: CustomerStrategy;
    onUpdateStrategy: (customerId: string, strategyId: string, updatedStrategy: Partial<CustomerStrategy>) => void;
}

const SolidarityTitlingLoanForm: React.FC<STLFormProps> = ({ customer, customerStrategy, onUpdateStrategy }) => {
    const stlData = customerStrategy.customData as SolidarityTitlingLoanData;

    if (!stlData) {
        return <div className="text-red-500">Error: Loan data is missing for this strategy.</div>;
    }

    const handleUpdate = (updatedData: Partial<SolidarityTitlingLoanData>) => {
        const newCustomData = { ...stlData, ...updatedData };
        onUpdateStrategy(customer.id, 'STL', { customData: newCustomData });
    };

    const handleAbonoUpdate = (index: number, updatedAbono: Partial<Abono>) => {
        const newAbonos = [...(stlData.abonos || [])];
        newAbonos[index] = { ...newAbonos[index], ...updatedAbono };
        handleUpdate({ abonos: newAbonos });
    };

    const totalAbonado = stlData.abonos?.reduce((acc, abono) => acc + (abono.realizado ? Number(abono.cantidad) || 0 : 0), 0) || 0;
    const totalPorPagar = (stlData.montoPrestamo || 0) - totalAbonado;


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <InputGroup
                    label="Referencia" id="referencia"
                    value={stlData.referencia || ''}
                    onChange={(e) => handleUpdate({ referencia: e.target.value })}
                />
                <InputGroup label="Riesgo" id="riesgo" >
                    <select id="riesgo" value={stlData.riesgo || 'Bajo'} onChange={(e) => handleUpdate({ riesgo: e.target.value as 'Bajo' | 'Medio' | 'Alto' })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                        <option>Bajo</option>
                        <option>Medio</option>
                        <option>Alto</option>
                    </select>
                </InputGroup>
                <div className="md:col-span-1">
                    <label htmlFor="expediente" className="block text-sm font-medium text-gray-700">Expediente (Link de Drive)</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="url"
                            id="expediente"
                            value={stlData.expediente || ''}
                            onChange={(e) => handleUpdate({ expediente: e.target.value })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm border-gray-300"
                            placeholder="https://docs.google.com/..."
                        />
                        <a
                            href={stlData.expediente?.startsWith('http') ? stlData.expediente : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm ${
                                !stlData.expediente || !stlData.expediente.startsWith('http')
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-100'
                            }`}
                            onClick={(e) => {
                                if (!stlData.expediente || !stlData.expediente.startsWith('http')) {
                                    e.preventDefault();
                                }
                            }}
                            aria-disabled={!stlData.expediente || !stlData.expediente.startsWith('http')}
                            title="Abrir enlace en nueva pestaña"
                        >
                            <ExternalLinkIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>
                 <InputGroup
                    label="Monto del Préstamo" id="montoPrestamo" type="number"
                    value={stlData.montoPrestamo || 0}
                    onChange={(e) => handleUpdate({ montoPrestamo: parseFloat(e.target.value) || 0 })}
                />
                 <InputGroup
                    label="Modalidad de Abono" id="modalidadAbono"
                    value={stlData.modalidadAbono || ''}
                    onChange={(e) => handleUpdate({ modalidadAbono: e.target.value })}
                />
                 <div className="flex items-center pt-6">
                    <input
                        id="firmoAdenda"
                        type="checkbox"
                        checked={stlData.firmoAdenda || false}
                        onChange={(e) => handleUpdate({ firmoAdenda: e.target.checked })}
                        className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"
                    />
                    <label htmlFor="firmoAdenda" className="ml-2 block text-sm text-gray-900">
                        Firmó Adenda
                    </label>
                </div>
            </div>

            <div className="mt-6">
                 <h4 className="text-md font-semibold text-gray-700 mb-2">Seguimiento de Abonos</h4>
                 <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Realizado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma de Pago</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stlData.abonos?.map((abono, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-4 py-2 whitespace-nowrap"><input type="checkbox" checked={abono.realizado} onChange={e => handleAbonoUpdate(index, { realizado: e.target.checked })} className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"/></td>
                                    <td className="px-4 py-2 whitespace-nowrap"><input type="number" value={abono.cantidad} onChange={e => handleAbonoUpdate(index, { cantidad: parseFloat(e.target.value) || 0 })} className="w-24 text-sm border-gray-300 rounded-md"/></td>
                                    <td className="px-4 py-2 whitespace-nowrap"><input type="date" value={abono.fecha} onChange={e => handleAbonoUpdate(index, { fecha: e.target.value })} className="w-36 text-sm border-gray-300 rounded-md"/></td>
                                    <td className="px-4 py-2 whitespace-nowrap"><input type="text" value={abono.formaDePago} onChange={e => handleAbonoUpdate(index, { formaDePago: e.target.value })} className="w-32 text-sm border-gray-300 rounded-md"/></td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex rounded-md shadow-sm">
                                            <input
                                                type="url"
                                                value={abono.comprobante || ''}
                                                onChange={(e) => handleAbonoUpdate(index, { comprobante: e.target.value })}
                                                className="flex-1 min-w-0 block w-full px-3 py-1 rounded-none rounded-l-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm border-gray-300"
                                                placeholder="https://..."
                                            />
                                            <a
                                                href={abono.comprobante?.startsWith('http') ? abono.comprobante : '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm ${
                                                    !abono.comprobante || !abono.comprobante.startsWith('http')
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                                onClick={(e) => {
                                                    if (!abono.comprobante || !abono.comprobante.startsWith('http')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                aria-disabled={!abono.comprobante || !abono.comprobante.startsWith('http')}
                                            >
                                                <ExternalLinkIcon className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap"><input type="checkbox" checked={abono.validado} onChange={e => handleAbonoUpdate(index, { validado: e.target.checked })} className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-8 bg-gray-100 p-4 rounded-b-lg">
                <div>
                    <span className="text-sm font-medium text-gray-500">Total Abonado:</span>
                    <span className="ml-2 text-lg font-bold text-status-green">${totalAbonado.toFixed(2)}</span>
                </div>
                 <div>
                    <span className="text-sm font-medium text-gray-500">Total por Pagar:</span>
                    <span className="ml-2 text-lg font-bold text-status-red">${totalPorPagar.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default SolidarityTitlingLoanForm;
