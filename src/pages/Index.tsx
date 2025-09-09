import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Dashboard } from '@/components/dashboard';
import { StockReceipt } from '@/components/stock-receipt';
import { StockConsumption } from '@/components/stock-consumption';
import { Reports } from '@/components/reports';
import { TransactionLogs } from '@/components/transaction-logs';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'receipt':
        return <StockReceipt />;
      case 'consumption':
        return <StockConsumption />;
      case 'reports':
        return <Reports />;
      case 'logs':
        return <TransactionLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="mt-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
