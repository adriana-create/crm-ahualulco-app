import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Customer } from '../types';
import { LegalStatus, FinancialStatus } from '../types';
import { STRATEGIES, RESPONSABLES } from '../constants';
import ProgressBar from './ProgressBar';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';


interface CustomerTableProps {
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
  onUpdatePotentialStrategies: (customerId: string, strategyIds: string[]) => void;
  onImportCustomers: (csvData: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdateDetails: (customerId: string, details: Partial<Pick<Customer, 'responsable'>>) => void;
}

type SortableKeys = 'firstName' | 'responsable' | 'group';

const legalStatusColorMap: Record<LegalStatus, string> = {
    [LegalStatus.NoPayment]: 'bg-status-red/20 text-status-red',
    [LegalStatus.PendingSignature]: 'bg-status-yellow/20 text-status-yellow',
    [LegalStatus.SignedDeedInProgress]: 'bg-status-blue/20 text-status-blue',
    [LegalStatus.DeedDelivered]: 'bg-status-green/20 text-status-green',
};

const financialStatusColorMap: Record<FinancialStatus, string> = {
  [FinancialStatus.ActiveCredit]: 'bg-status-green/20 text-status-green',
  [FinancialStatus.NoCredit]: 'bg-status-gray/20 text-status-gray',
  [FinancialStatus.PaidOff]: 'bg-status-blue/20 text-status-blue',
  [FinancialStatus.Default]: 'bg-status-red/20 text-status-red',
};


const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onSelectCustomer, onUpdatePotentialStrategies, onImportCustomers, onDeleteCustomer, loading, error, onRetry, onUpdateDetails }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [filters, setFilters] = useState({ responsable: '', group: '', activeStrategy: '' });
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uniqueGroups = useMemo(() => [...new Set(customers.map(c => c.group).filter(Boolean).sort())], [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    let sortableCustomers = [...customers];

    // Filtering
    sortableCustomers = sortableCustomers.filter(customer => {
        const responsableMatch = filters.responsable ? customer.responsable === filters.responsable : true;
        const groupMatch = filters.group ? customer.group === filters.group : true;
        const strategyMatch = filters.activeStrategy 
            ? customer.strategies.some(s => s.strategyId === filters.activeStrategy && s.accepted) 
            : true;
        return responsableMatch && groupMatch && strategyMatch;
    });

    // Sorting
    if (sortConfig.key) {
        sortableCustomers.sort((a, b) => {
            const aValue = String(a[sortConfig.key!] || '').toLowerCase();
            const bValue = String(b[sortConfig.key!] || '').toLowerCase();

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }

    return sortableCustomers;
  }, [customers, filters, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        setSortConfig({ key: null, direction: 'ascending'});
        return;
    }
    setSortConfig({ key, direction });
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onImportCustomers(text);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  const handleDelete = (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
        onDeleteCustomer(customerId);
    }
  }
  
  const SortableHeader: React.FC<{ sortKey: SortableKeys; title: string; className?: string }> = ({ sortKey, title, className }) => (
    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className || ''}`}>
      <div 
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => requestSort(sortKey)}
      >
        <span>{title}</span>
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4 text-gray-600" /> : <ArrowDownIcon className="w-4 h-4 text-gray-600" />
        )}
      </div>
    </th>
  );


  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={10} className="text-center p-16">
            <div className="flex justify-center items-center flex-col text-gray-500">
              <SpinnerIcon className="h-12 w-12" />
              <h3 className="text-lg font-semibold text-gray-700 mt-4">Cargando Clientes...</h3>
              <p>Por favor espere un momento.</p>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={10} className="p-8">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-red-800">Error al Cargar los Datos</h3>
                <div className="mt-2 text-sm text-red-700 max-w-xl mx-auto">
                    <p>{error}</p>
                </div>
                <div className="mt-6">
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                    >
                    Intentar de Nuevo
                    </button>
                </div>
            </div>
          </td>
        </tr>
      );
    }
    
    if (customers.length === 0) {
        return (
            <tr>
                <td colSpan={10} className="text-center p-16">
                    <div className="flex justify-center mb-4">
                        <UsersIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No se Encontraron Clientes</h3>
                    <p className="text-gray-500 mt-2">Para comenzar, importe clientes desde un archivo CSV.</p>
                </td>
            </tr>
        );
    }
    
    if (filteredAndSortedCustomers.length === 0) {
       return (
            <tr>
                <td colSpan={10} className="text-center p-16">
                    <div className="flex justify-center mb-4">
                        <UsersIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No hay clientes que coincidan con los filtros</h3>
                    <p className="text-gray-500 mt-2">Intente ajustar o borrar los filtros para ver más resultados.</p>
                </td>
            </tr>
        );
    }

    return (
      filteredAndSortedCustomers.map((customer, index) => {
        const acceptedStrategies = customer.strategies.filter(s => s.accepted);
        const rowClass = customer.modificacionLote ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100';
        const rowTitle = customer.modificacionLote ? 'Este cliente tiene una modificación en la superficie del lote' : '';

        return (
          <tr 
            key={customer.id} 
            onClick={() => onSelectCustomer(customer.id)} 
            className={`cursor-pointer transition-colors duration-200 ${rowClass}`}
            title={rowTitle}
          >
            <td className="px-6 py-4 whitespace-nowrap align-top text-sm text-gray-500">{index + 1}</td>
            <td className="px-6 py-4 whitespace-nowrap align-top">
              <div className="text-sm font-medium text-gray-900">{`${customer.firstName} ${customer.paternalLastName}`}</div>
              <div className="text-sm text-gray-500">{customer.id}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap align-top text-sm text-gray-800">
                <select
                    value={customer.responsable || ''}
                    onChange={(e) => onUpdateDetails(customer.id, { responsable: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    <option value="">-- Asignar --</option>
                    {RESPONSABLES.map(email => <option key={email} value={email}>{email.split('@')[0]}</option>)}
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap align-top">
              <div className="text-sm text-gray-700">{customer.group}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap align-top">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${legalStatusColorMap[customer.legalStatus]}`}>
                {customer.legalStatus}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap align-top">
              <ProgressBar percentage={customer.pathwayToTitling} />
            </td>
            <td className="px-6 py-4 align-top">
              <div className="relative" ref={openDropdown === customer.id ? dropdownRef : null}>
                <div className="flex flex-wrap gap-1 mb-2 max-w-xs">
                  {customer.potentialStrategies && customer.potentialStrategies.length > 0 ? (
                      customer.potentialStrategies.map(stratId => {
                          const stratInfo = STRATEGIES.find(s => s.id === stratId);
                          return (
                              <span key={stratId} className="px-2 py-1 text-xs font-medium text-brand-primary bg-blue-100 rounded-full">
                                  {stratInfo?.name || stratId}
                              </span>
                          );
                      })
                  ) : (
                      <span className="text-xs text-gray-400 italic">Ninguna</span>
                  )}
                </div>
                 <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === customer.id ? null : customer.id);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    {openDropdown === customer.id ? 'Cerrar' : 'Gestionar'}
                  </button>

                {openDropdown === customer.id && (
                  <div className="absolute z-20 w-64 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                    <div className="p-2 text-sm font-semibold text-gray-700 border-b">Seleccionar Estrategias</div>
                    <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                      {STRATEGIES.map(strategy => (
                        <label key={strategy.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded"
                            checked={customer.potentialStrategies.includes(strategy.id)}
                            onChange={(e) => {
                                const newStrategies = e.target.checked
                                    ? [...customer.potentialStrategies, strategy.id]
                                    : customer.potentialStrategies.filter(id => id !== strategy.id);
                                onUpdatePotentialStrategies(customer.id, newStrategies);
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                          <span className="text-sm text-gray-800">{strategy.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 align-top">
              {acceptedStrategies.length > 0 ? (
                  <ul className="space-y-2 max-w-xs">
                      {acceptedStrategies.map(cs => {
                          const strategyInfo = STRATEGIES.find(s => s.id === cs.strategyId);
                          return (
                              <li key={cs.strategyId}>
                                  <div className="font-semibold">{strategyInfo?.name}</div>
                                  <div className="text-xs text-gray-500">
                                      Estatus: <span className="font-medium">{cs.status}</span>
                                  </div>
                              </li>
                          );
                      })}
                  </ul>
              ) : (
                  <span className="text-gray-400 italic">Sin estrategias activas</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap align-top">
              <button
                  onClick={(e) => handleDelete(e, customer.id)}
                  className="p-2 text-status-red rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-red transition-colors"
                  aria-label={`Delete ${customer.firstName}`}
              >
                  <TrashIcon className="w-5 h-5 pointer-events-none" />
              </button>
            </td>
          </tr>
        );
      })
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-600 flex justify-between items-center bg-header-bg">
            <div>
              <h2 className="text-2xl font-bold text-white">Resumen de Clientes</h2>
              <p className="text-gray-300 mt-1">Seleccione un cliente para ver su trayectoria detallada.</p>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                style={{ display: 'none' }}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-primary bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
            >
                <DocumentArrowUpIcon className="w-5 h-5" />
                Importar CSV
            </button>
        </div>
        {!loading && !error && customers.length > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                Mostrando <strong>{filteredAndSortedCustomers.length}</strong> de <strong>{customers.length}</strong> clientes.
            </div>
        )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <SortableHeader sortKey="firstName" title="Nombre" />
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">
                <div 
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => requestSort('responsable')}
                >
                    <span>Responsable</span>
                    {sortConfig.key === 'responsable' && (
                    sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4 text-gray-600" /> : <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                </div>
                 <select
                    value={filters.responsable}
                    onChange={(e) => handleFilterChange('responsable', e.target.value)}
                    className="w-full text-xs mt-1 p-1 rounded border-gray-300"
                >
                    <option value="">Todos</option>
                    {RESPONSABLES.map(r => <option key={r} value={r}>{r.split('@')[0]}</option>)}
                </select>
              </th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                <div 
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => requestSort('group')}
                >
                    <span>Grupo</span>
                    {sortConfig.key === 'group' && (
                    sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4 text-gray-600" /> : <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                </div>
                 <select
                    value={filters.group}
                    onChange={(e) => handleFilterChange('group', e.target.value)}
                    className="w-full text-xs mt-1 p-1 rounded border-gray-300"
                >
                    <option value="">Todos</option>
                    {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Estatus Legal (Reciente)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Camino a la construcción
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                Estrategias Ofertadas / Potenciales
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                <div className="flex items-center gap-2 select-none">
                    <span>Estrategias Activas</span>
                </div>
                 <select
                    value={filters.activeStrategy}
                    onChange={(e) => handleFilterChange('activeStrategy', e.target.value)}
                    className="w-full text-xs mt-1 p-1 rounded border-gray-300"
                >
                    <option value="">Todas</option>
                    {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderTableContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;