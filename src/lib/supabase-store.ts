import { supabase } from "@/integrations/supabase/client";
import { StockItem, StockReceipt, StockConsumption, TransactionLog } from "@/types/inventory";

class SupabaseInventoryStore {
  async getStockItems(): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      itemName: item.item_name,
      itemCode: item.item_code,
      currentQuantity: item.current_quantity,
      unit: item.unit,
      lastRate: item.last_rate,
      totalValue: item.total_value,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async getStockItem(itemCode: string): Promise<StockItem | null> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('item_code', itemCode)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      itemName: data.item_name,
      itemCode: data.item_code,
      currentQuantity: data.current_quantity,
      unit: data.unit,
      lastRate: data.last_rate,
      totalValue: data.total_value,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateStockItem(itemCode: string, updates: Partial<StockItem>): Promise<void> {
    const { error } = await supabase
      .from('stock_items')
      .update(updates)
      .eq('item_code', itemCode);
    
    if (error) throw error;
  }

  async getReceipts(): Promise<StockReceipt[]> {
    const { data, error } = await supabase
      .from('stock_receipts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(receipt => ({
      id: receipt.id,
      itemName: receipt.item_name,
      itemCode: receipt.item_code,
      quantityReceived: receipt.quantity_received,
      ratePerUnit: receipt.rate_per_unit,
      unit: receipt.unit,
      totalValue: receipt.total_value,
      supplierName: receipt.supplier_name,
      deliveryDate: new Date(receipt.delivery_date),
      receivedBy: receipt.received_by,
      createdAt: new Date(receipt.created_at),
      createdBy: receipt.created_by,
      updatedAt: receipt.updated_at ? new Date(receipt.updated_at) : undefined,
      updatedBy: receipt.updated_by || undefined
    }));
  }

  async addReceipt(receipt: Omit<StockReceipt, 'id' | 'createdAt'>): Promise<void> {
    // Insert receipt
    const { data: receiptData, error: receiptError } = await supabase
      .from('stock_receipts')
      .insert({
        item_name: receipt.itemName,
        item_code: receipt.itemCode,
        quantity_received: receipt.quantityReceived,
        rate_per_unit: receipt.ratePerUnit,
        unit: receipt.unit,
        total_value: receipt.totalValue,
        supplier_name: receipt.supplierName,
        delivery_date: receipt.deliveryDate.toISOString().split('T')[0],
        received_by: receipt.receivedBy,
        created_by: receipt.createdBy
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // Update or create stock item
    const existingItem = await this.getStockItem(receipt.itemCode);
    
    if (existingItem) {
      const newQuantity = existingItem.currentQuantity + receipt.quantityReceived;
      const newTotalValue = existingItem.totalValue + receipt.totalValue;
      
      await this.updateStockItem(receipt.itemCode, {
        currentQuantity: newQuantity,
        lastRate: receipt.ratePerUnit,
        totalValue: newTotalValue,
        updatedAt: new Date()
      });
    } else {
      const { error: stockError } = await supabase
        .from('stock_items')
        .insert({
          item_name: receipt.itemName,
          item_code: receipt.itemCode,
          current_quantity: receipt.quantityReceived,
          unit: receipt.unit,
          last_rate: receipt.ratePerUnit,
          total_value: receipt.totalValue
        });
      
      if (stockError) throw stockError;
    }

    // Log transaction
    await this.addLog({
      type: 'receipt',
      referenceId: receiptData.id,
      action: 'created',
      performedBy: receipt.createdBy || 'system',
      details: `Added ${receipt.quantityReceived} ${receipt.unit} of ${receipt.itemName} from ${receipt.supplierName}`
    });
  }

  async getConsumptions(): Promise<StockConsumption[]> {
    const { data, error } = await supabase
      .from('stock_consumptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(consumption => ({
      id: consumption.id,
      itemName: consumption.item_name,
      itemCode: consumption.item_code,
      quantityUsed: consumption.quantity_used,
      unit: consumption.unit,
      purposeActivityCode: consumption.purpose_activity_code,
      usedBy: consumption.used_by,
      date: new Date(consumption.date),
      remarks: consumption.remarks || undefined,
      createdAt: new Date(consumption.created_at),
      createdBy: consumption.created_by,
      updatedAt: consumption.updated_at ? new Date(consumption.updated_at) : undefined,
      updatedBy: consumption.updated_by || undefined
    }));
  }

  async addConsumption(consumption: Omit<StockConsumption, 'id' | 'createdAt'>): Promise<boolean> {
    const existingItem = await this.getStockItem(consumption.itemCode);
    
    if (!existingItem || existingItem.currentQuantity < consumption.quantityUsed) {
      return false;
    }

    // Insert consumption
    const { data: consumptionData, error: consumptionError } = await supabase
      .from('stock_consumptions')
      .insert({
        item_name: consumption.itemName,
        item_code: consumption.itemCode,
        quantity_used: consumption.quantityUsed,
        unit: consumption.unit,
        purpose_activity_code: consumption.purposeActivityCode,
        used_by: consumption.usedBy,
        date: consumption.date.toISOString().split('T')[0],
        remarks: consumption.remarks,
        created_by: consumption.createdBy
      })
      .select()
      .single();

    if (consumptionError) throw consumptionError;

    // Update stock
    const newQuantity = existingItem.currentQuantity - consumption.quantityUsed;
    const unitValue = existingItem.totalValue / existingItem.currentQuantity;
    const newTotalValue = newQuantity * unitValue;

    await this.updateStockItem(consumption.itemCode, {
      currentQuantity: newQuantity,
      totalValue: newTotalValue,
      updatedAt: new Date()
    });

    // Log transaction
    await this.addLog({
      type: 'consumption',
      referenceId: consumptionData.id,
      action: 'created',
      performedBy: consumption.createdBy || 'system',
      details: `Used ${consumption.quantityUsed} ${consumption.unit} of ${consumption.itemName} for ${consumption.purposeActivityCode}`
    });

    return true;
  }

  async getLogs(): Promise<TransactionLog[]> {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(log => ({
      id: log.id,
      type: log.type as 'receipt' | 'consumption',
      referenceId: log.reference_id,
      action: log.action as 'created' | 'updated' | 'deleted',
      performedBy: log.performed_by,
      timestamp: new Date(log.timestamp),
      details: log.details
    }));
  }

  private async addLog(log: Omit<TransactionLog, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('transaction_logs')
      .insert({
        type: log.type,
        reference_id: log.referenceId,
        action: log.action,
        performed_by: log.performedBy,
        details: log.details
      });
    
    if (error) throw error;
  }

  async exportReceiptsToCSV(): Promise<string> {
    const receipts = await this.getReceipts();
    const headers = ['ID', 'Item Name', 'Item Code', 'Quantity Received', 'Rate Per Unit', 'Unit', 'Total Value', 'Supplier Name', 'Delivery Date', 'Received By', 'Created At'];
    const rows = receipts.map(receipt => [
      receipt.id,
      receipt.itemName,
      receipt.itemCode,
      receipt.quantityReceived,
      receipt.ratePerUnit,
      receipt.unit,
      receipt.totalValue,
      receipt.supplierName,
      receipt.deliveryDate,
      receipt.receivedBy,
      receipt.createdAt
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async exportConsumptionsToCSV(): Promise<string> {
    const consumptions = await this.getConsumptions();
    const headers = ['ID', 'Item Name', 'Item Code', 'Quantity Used', 'Unit', 'Purpose/Activity Code', 'Used By', 'Date', 'Remarks', 'Created At'];
    const rows = consumptions.map(consumption => [
      consumption.id,
      consumption.itemName,
      consumption.itemCode,
      consumption.quantityUsed,
      consumption.unit,
      consumption.purposeActivityCode,
      consumption.usedBy,
      consumption.date,
      consumption.remarks || '',
      consumption.createdAt
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async exportStockValuationToCSV(): Promise<string> {
    const stockItems = await this.getStockItems();
    const headers = ['Item Name', 'Item Code', 'Current Quantity', 'Unit', 'Last Rate', 'Total Value'];
    const rows = stockItems.map(item => [
      item.itemName,
      item.itemCode,
      item.currentQuantity,
      item.unit,
      item.lastRate,
      item.totalValue
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const supabaseInventoryStore = new SupabaseInventoryStore();