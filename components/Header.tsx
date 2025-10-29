import React from 'react';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface HeaderProps {
  lastSyncTime: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ lastSyncTime, loading, onRefresh }) => {
  return (
    <header className="bg-header-bg shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-white mr-3" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Base de Datos: Clientes Ahualulco</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-xs text-gray-300">
                    Última sincronización:
                </p>
                <p className="text-sm font-semibold text-white">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString() : '...'}
                </p>
            </div>
            <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center p-2 text-white bg-white/10 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Actualizar datos"
                title="Actualizar datos"
            >
                {loading ? (
                    <SpinnerIcon className="h-5 w-5" />
                ) : (
                    <ArrowPathIcon className="h-5 w-5" />
                )}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
