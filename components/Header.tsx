
import React from 'react';
import { UserGroupIcon } from './icons/UserGroupIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-header-bg shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center">
        <UserGroupIcon className="h-8 w-8 text-white mr-3" />
        <h1 className="text-2xl font-bold text-white tracking-tight">Base de Datos: Clientes Ahualulco | Homebuilding</h1>
      </div>
    </header>
  );
};

export default Header;