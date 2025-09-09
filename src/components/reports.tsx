import { useState, useEffect } from 'react';
import { supabaseInventoryStore } from '@/lib/supabase-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, TrendingUp, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function Reports() {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  
  // Load initial data and auto-refresh every 5 seconds
  useEffect(() => {
    const loadData = async () => {
      try {
        const [receiptsData, consumptionsData, stockItemsData] = await Promise.all([
          supabaseInventoryStore.getReceipts(),
          supabaseInventoryStore.getConsumptions(),
          supabaseInventoryStore.getStockItems()
        ]);
        setReceipts(receiptsData);
        setConsumptions(consumptionsData);
        setStockItems(stockItemsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
    
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: 'Download Started',
      description: `${filename} is being downloaded`,
      variant: 'default',
    });
  };

  const handleReceiptDownload = async () => {
    try {
      const csv = await supabaseInventoryStore.exportReceiptsToCSV();
      downloadCSV(csv, `stock-receipts-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Failed to export receipts:', error);
    }
  };

  const handleConsumptionDownload = async () => {
    try {
      const csv = await supabaseInventoryStore.exportConsumptionsToCSV();
      downloadCSV(csv, `stock-consumptions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Failed to export consumptions:', error);
    }
  };

  const handleValuationDownload = async () => {
    try {
      const csv = await supabaseInventoryStore.exportStockValuationToCSV();
      downloadCSV(csv, `stock-valuation-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Failed to export stock valuation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Inventory Reports</h2>
        <p className="text-muted-foreground mt-2">
          Generate and export comprehensive inventory reports
        </p>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="consumptions">Consumptions</TabsTrigger>
          <TabsTrigger value="valuation">Stock Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Stock Receipt Report
                </div>
                <Button onClick={handleReceiptDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{receipts.length}</p>
                    <p className="text-sm text-muted-foreground">Total Receipts</p>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">
                      ₹{receipts.reduce((sum, r) => sum + r.totalValue, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-2xl font-bold text-accent">
                      {new Set(receipts.map(r => r.supplierName)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Suppliers</p>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">
                      {receipts.filter(r => r.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Receipts</h4>
                  {receipts.slice(0, 5).map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{receipt.itemName}</p>
                        <p className="text-sm text-muted-foreground">{receipt.supplierName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{receipt.quantityReceived} {receipt.unit}</p>
                        <p className="text-sm text-muted-foreground">₹{receipt.totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Stock Consumption Report
                </div>
                <Button onClick={handleConsumptionDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{consumptions.length}</p>
                    <p className="text-sm text-muted-foreground">Total Consumptions</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <p className="text-2xl font-bold text-destructive">
                      {new Set(consumptions.map(c => c.itemCode)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Items Consumed</p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-2xl font-bold text-accent">
                      {new Set(consumptions.map(c => c.purposeActivityCode)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Activity Types</p>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">
                      {consumptions.filter(c => c.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Consumptions</h4>
                  {consumptions.slice(0, 5).map((consumption) => (
                    <div key={consumption.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{consumption.itemName}</p>
                        <p className="text-sm text-muted-foreground">{consumption.purposeActivityCode} - {consumption.usedBy}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{consumption.quantityUsed} {consumption.unit}</p>
                        <p className="text-sm text-muted-foreground">{format(consumption.date, 'MMM dd')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Stock Valuation Report
                </div>
                <Button onClick={handleValuationDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stockItems.length}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">
                      ₹{stockItems.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Valuation</p>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">
                      {stockItems.filter(item => item.currentQuantity < 50).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-2xl font-bold text-accent">
                      ₹{Math.round(stockItems.reduce((sum, item) => sum + item.totalValue, 0) / stockItems.length).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Item Value</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Current Stock Valuation</h4>
                  {stockItems.map((item) => (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}