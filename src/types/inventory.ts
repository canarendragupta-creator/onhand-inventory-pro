export interface StockItem {
  id: string;
  itemName: string;
  itemCode: string;
  currentQuantity: number;
  unit: string;
  lastRate: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockReceipt {
  id: string;
  itemName: string;
  itemCode: string;
  quantityReceived: number;
  ratePerUnit: number;
  unit: string;
  totalValue: number;
  supplierName: string;
  deliveryDate: Date;
  receivedBy: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface StockConsumption {
  id: string;
  itemName: string;
  itemCode: string;
  quantityUsed: number;
  unit: string;
  purposeActivityCode: string;
  usedBy: string;
  date: Date;
  remarks?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface TransactionLog {
  id: string;
  type: 'receipt' | 'consumption';
  referenceId: string;
  action: 'created' | 'updated' | 'deleted';
  performedBy: string;
  timestamp: Date;
  details: string;
}

export type UnitOfMeasurement = 'pcs' | 'kg' | 'm' | 'm2' | 'm3' | 'ltr' | 'box' | 'bag' | 'roll' | 'ton';

export type ActivityCode = 'CONSTR' | 'MAINT' | 'SETUP' | 'DEMO' | 'INSTALL' | 'REPAIR' | 'TEST' | 'OTHER';