import { useState, useEffect } from 'react';
import { supabaseInventoryStore } from '@/lib/supabase-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Plus, Minus, Edit, Trash } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function TransactionLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  
  // Load initial data and auto-refresh every 5 seconds
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logsData = await supabaseInventoryStore.getLogs();
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    };

    loadLogs();
    
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (type: string, action: string) => {
    if (type === 'receipt') return <Plus className="h-4 w-4 text-success" />;
    if (type === 'consumption') return <Minus className="h-4 w-4 text-destructive" />;
    if (action === 'updated') return <Edit className="h-4 w-4 text-warning" />;
    if (action === 'deleted') return <Trash className="h-4 w-4 text-destructive" />;
    return <History className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionVariant = (type: string, action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (type === 'receipt') return 'default';
    if (type === 'consumption') return 'destructive';
    if (action === 'updated') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Transaction Logs</h2>
        <p className="text-muted-foreground mt-2">
          Complete history of all inventory transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transaction logs available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="relative">
                  {index !== logs.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-full bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-background border-2 border-muted rounded-full flex items-center justify-center">
                        {getActionIcon(log.type, log.action)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="bg-card border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getActionVariant(log.type, log.action)}>
                                {log.type.charAt(0).toUpperCase() + log.type.slice(1)} {log.action}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {log.referenceId}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {log.details}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>by {log.performedBy}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                            <span>•</span>
                            <span>{format(log.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}