import { StockItem, StockReceipt, StockConsumption, TransactionLog } from '@/types/inventory';

// Sample data
const sampleStockItems: StockItem[] = [
  {
    id: '1',
    itemName: 'Portland Cement',
    itemCode: 'CEM001',
    currentQuantity: 150,
    unit: 'bag',
    lastRate: 850,
    totalValue: 127500,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    itemName: 'Steel Rebar 12mm',
    itemCode: 'STL012',
    currentQuantity: 2500,
    unit: 'kg',
    lastRate: 65,
    totalValue: 162500,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    itemName: 'Ready Mix Concrete M25',
    itemCode: 'RMC025',
    currentQuantity: 45,
    unit: 'm3',
    lastRate: 4500,
    totalValue: 202500,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '4',
    itemName: 'Brick (Common)',
    itemCode: 'BRK001',
    currentQuantity: 15000,
    unit: 'pcs',
    lastRate: 8,
    totalValue: 120000,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-17'),
  },
];

const sampleReceipts: StockReceipt[] = [
  {
    id: 'R001',
    itemName: 'Portland Cement',
    itemCode: 'CEM001',
    quantityReceived: 100,
    ratePerUnit: 850,
    unit: 'bag',
    totalValue: 85000,
    supplierName: 'ABC Cement Co.',
    deliveryDate: new Date('2024-01-20'),
    receivedBy: 'John Supervisor',
    createdAt: new Date('2024-01-20'),
    createdBy: 'John Supervisor',
  },
  {
    id: 'R002',
    itemName: 'Steel Rebar 12mm',
    itemCode: 'STL012',
    quantityReceived: 1000,
    ratePerUnit: 65,
    unit: 'kg',
    totalValue: 65000,
    supplierName: 'XYZ Steel Industries',
    deliveryDate: new Date('2024-01-18'),
    receivedBy: 'Mike Foreman',
    createdAt: new Date('2024-01-18'),
    createdBy: 'Mike Foreman',
  },
];

const sampleConsumptions: StockConsumption[] = [
  {
    id: 'C001',
    itemName: 'Portland Cement',
    itemCode: 'CEM001',
    quantityUsed: 25,
    unit: 'bag',
    purposeActivityCode: 'CONSTR',
    usedBy: 'Construction Team A',
    date: new Date('2024-01-21'),
    remarks: 'Foundation work - Block A',
    createdAt: new Date('2024-01-21'),
    createdBy: 'John Supervisor',
  },
  {
    id: 'C002',
    itemName: 'Steel Rebar 12mm',
    itemCode: 'STL012',
    quantityUsed: 500,
    unit: 'kg',
    purposeActivityCode: 'CONSTR',
    usedBy: 'Construction Team B',
    date: new Date('2024-01-19'),
    remarks: 'Column reinforcement',
    createdAt: new Date('2024-01-19'),
    createdBy: 'Mike Foreman',
  },
];

const sampleLogs: TransactionLog[] = [
  {
    id: 'L001',
    type: 'receipt',
    referenceId: 'R001',
    action: 'created',
    performedBy: 'John Supervisor',
    timestamp: new Date('2024-01-20'),
    details: 'Received 100 bags of Portland Cement from ABC Cement Co.',
  },
  {
    id: 'L002',
    type: 'consumption',
    referenceId: 'C001',
    action: 'created',
    performedBy: 'John Supervisor',
    timestamp: new Date('2024-01-21'),
    details: 'Consumed 25 bags of Portland Cement for foundation work',
  },
];

// In-memory store (in a real app, this would be a proper state management solution)
class InventoryStore {
  private stockItems: StockItem[] = [...sampleStockItems];
  private receipts: StockReceipt[] = [...sampleReceipts];
  private consumptions: StockConsumption[] = [...sampleConsumptions];
  private logs: TransactionLog[] = [...sampleLogs];

  // Stock Items
  getStockItems(): StockItem[] {
    return this.stockItems;
  }

  getStockItem(itemCode: string): StockItem | undefined {
    return this.stockItems.find(item => item.itemCode === itemCode);
  }

  updateStockItem(itemCode: string, updates: Partial<StockItem>): void {
    const index = this.stockItems.findIndex(item => item.itemCode === itemCode);
    if (index !== -1) {
      this.stockItems[index] = { ...this.stockItems[index], ...updates, updatedAt: new Date() };
    }
  }

  // Receipts
  getReceipts(): StockReceipt[] {
    return this.receipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  addReceipt(receipt: Omit<StockReceipt, 'id' | 'createdAt'>): StockReceipt {
    const newReceipt: StockReceipt = {
      ...receipt,
      id: `R${String(this.receipts.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    
    this.receipts.push(newReceipt);
    
    // Update stock
    this.updateStock(receipt.itemCode, receipt.quantityReceived, 'add', receipt.ratePerUnit);
    
    // Add log
    this.addLog({
      type: 'receipt',
      referenceId: newReceipt.id,
      action: 'created',
      performedBy: receipt.createdBy,
      details: `Received ${receipt.quantityReceived} ${receipt.unit} of ${receipt.itemName}`,
    });
    
    return newReceipt;
  }

  // Consumptions
  getConsumptions(): StockConsumption[] {
    return this.consumptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  addConsumption(consumption: Omit<StockConsumption, 'id' | 'createdAt'>): StockConsumption | null {
    const stockItem = this.getStockItem(consumption.itemCode);
    if (!stockItem || stockItem.currentQuantity < consumption.quantityUsed) {
      return null; // Insufficient stock
    }

    const newConsumption: StockConsumption = {
      ...consumption,
      id: `C${String(this.consumptions.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    
    this.consumptions.push(newConsumption);
    
    // Update stock
    this.updateStock(consumption.itemCode, consumption.quantityUsed, 'subtract');
    
    // Add log
    this.addLog({
      type: 'consumption',
      referenceId: newConsumption.id,
      action: 'created',
      performedBy: consumption.createdBy,
      details: `Consumed ${consumption.quantityUsed} ${consumption.unit} of ${consumption.itemName}`,
    });
    
    return newConsumption;
  }

  // Logs
  getLogs(): TransactionLog[] {
    return this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private addLog(log: Omit<TransactionLog, 'id' | 'timestamp'>): void {
    const newLog: TransactionLog = {
      ...log,
      id: `L${String(this.logs.length + 1).padStart(3, '0')}`,
      timestamp: new Date(),
    };
    this.logs.push(newLog);
  }

  private updateStock(itemCode: string, quantity: number, operation: 'add' | 'subtract', newRate?: number): void {
    let stockItem = this.getStockItem(itemCode);
    
    if (!stockItem) {
      // Create new stock item if it doesn't exist
      const newStockItem: StockItem = {
        id: String(this.stockItems.length + 1),
        itemName: itemCode, // This should be properly mapped
        itemCode,
        currentQuantity: operation === 'add' ? quantity : 0,
        unit: 'pcs', // Default unit
        lastRate: newRate || 0,
        totalValue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.stockItems.push(newStockItem);
      stockItem = newStockItem;
    }

    const newQuantity = operation === 'add' 
      ? stockItem.currentQuantity + quantity 
      : stockItem.currentQuantity - quantity;

    const updates: Partial<StockItem> = {
      currentQuantity: Math.max(0, newQuantity),
      updatedAt: new Date(),
    };

    if (newRate) {
      updates.lastRate = newRate;
    }

    updates.totalValue = updates.currentQuantity! * (updates.lastRate || stockItem.lastRate);

    this.updateStockItem(itemCode, updates);
  }

  // Export functions
  exportReceiptsToCSV(): string {
    const headers = ['Receipt ID', 'Item Name', 'Item Code', 'Quantity', 'Rate', 'Unit', 'Total Value', 'Supplier', 'Delivery Date', 'Received By', 'Created At'];
    const rows = this.receipts.map(receipt => [
      receipt.id,
      receipt.itemName,
      receipt.itemCode,
      receipt.quantityReceived,
      receipt.ratePerUnit,
      receipt.unit,
      receipt.totalValue,
      receipt.supplierName,
      receipt.deliveryDate.toLocaleDateString(),
      receipt.receivedBy,
      receipt.createdAt.toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  exportConsumptionsToCSV(): string {
    const headers = ['Consumption ID', 'Item Name', 'Item Code', 'Quantity Used', 'Unit', 'Purpose Code', 'Used By', 'Date', 'Remarks', 'Created At'];
    const rows = this.consumptions.map(consumption => [
      consumption.id,
      consumption.itemName,
      consumption.itemCode,
      consumption.quantityUsed,
      consumption.unit,
      consumption.purposeActivityCode,
      consumption.usedBy,
      consumption.date.toLocaleDateString(),
      consumption.remarks || '',
      consumption.createdAt.toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  exportStockValuationToCSV(): string {
    const headers = ['Item Code', 'Item Name', 'Current Quantity', 'Unit', 'Rate per Unit', 'Total Value', 'Last Updated'];
    const rows = this.stockItems.map(item => [
      item.itemCode,
      item.itemName,
      item.currentQuantity,
      item.unit,
      item.lastRate,
      item.totalValue,
      item.updatedAt.toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const inventoryStore = new InventoryStore();