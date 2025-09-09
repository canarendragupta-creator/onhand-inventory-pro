import { useMemo } from 'react';
import { inventoryStore } from '@/lib/inventory-store';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Activity,
  AlertTriangle 
} from 'lucide-react';

export function Dashboard() {
  const stockItems = inventoryStore.getStockItems();
  const receipts = inventoryStore.getReceipts();
  const consumptions = inventoryStore.getConsumptions();

  const stats = useMemo(() => {
    const totalItems = stockItems.length;
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = stockItems.filter(item => item.currentQuantity < 50).length;
    const todayTransactions = receipts.filter(r => 
      r.createdAt.toDateString() === new Date().toDateString()
    ).length + consumptions.filter(c => 
      c.createdAt.toDateString() === new Date().toDateString()
    ).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      todayTransactions,
    };
  }, [stockItems, receipts, consumptions]);

  const lowStockItems = stockItems.filter(item => item.currentQuantity < 50);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Inventory Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time inventory management for your construction site
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          description="Active inventory items"
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Total Value"
          value={`₹${stats.totalValue.toLocaleString()}`}
          description="Current stock valuation"
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockItems}
          description="Items below threshold"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Today's Activity"
          value={stats.todayTransactions}
          description="Receipts + Consumptions"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.currentQuantity} {item.unit}</p>
                    <p className="text-sm text-muted-foreground">₹{item.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No low stock alerts
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">{item.currentQuantity} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">Low stock</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}