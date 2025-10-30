import React, { useState } from 'react';
import { useCustomers } from './hooks/useCustomers';
import CustomerTable from './components/CustomerTable';
import CustomerDetail from './components/CustomerDetail';
import Header from './components/Header';

function App() {
  const { 
    customers, 
    getCustomerById, 
    updateCustomerDetails, 
    updateCustomerStrategy, 
    updateTask, 
    addTask, 
    updateCustomerStrategyCustomData, 
    updateCustomerPotentialStrategies, 
    addStrategyToCustomer,
    importCustomers, 
    deleteCustomer,
    loading,
    error,
    lastSyncTime,
    fetchCustomers
  } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const selectedCustomer = selectedCustomerId ? getCustomerById(selectedCustomerId) : null;

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleBack = () => {
    setSelectedCustomerId(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    deleteCustomer(customerId);
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        lastSyncTime={lastSyncTime}
        loading={loading}
        onRefresh={fetchCustomers}
      />
      <main className="max-w-screen-2xl mx-auto p-4 md:p-8">
        {selectedCustomer ? (
          <CustomerDetail
            customer={selectedCustomer}
            onBack={handleBack}
            onUpdateDetails={updateCustomerDetails}
            onUpdateStrategy={updateCustomerStrategy}
            // FIX: Pass the 'updateTask' function from the hook to the 'onUpdateTask' prop.
            onUpdateTask={updateTask}
            onAddTask={addTask}
            onUpdateStrategyCustomData={updateCustomerStrategyCustomData}
            onAddStrategy={addStrategyToCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        ) : (
          <CustomerTable 
            customers={customers} 
            loading={loading}
            error={error}
            onRetry={fetchCustomers}
            onSelectCustomer={handleSelectCustomer} 
            onUpdatePotentialStrategies={updateCustomerPotentialStrategies}
            onImportCustomers={importCustomers}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdateDetails={updateCustomerDetails}
          />
        )}
      </main>
    </div>
  );
}

export default App;