import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryStore } from '@/lib/inventory-store';
import { ActivityCode } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Minus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const activityCodes: { value: ActivityCode; label: string }[] = [
  { value: 'CONSTR', label: 'Construction' },
  { value: 'MAINT', label: 'Maintenance' },
  { value: 'SETUP', label: 'Setup' },
  { value: 'DEMO', label: 'Demolition' },
  { value: 'INSTALL', label: 'Installation' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'TEST', label: 'Testing' },
  { value: 'OTHER', label: 'Other' },
];

const consumptionSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required'),
  quantityUsed: z.number().min(0.01, 'Quantity must be greater than 0'),
  purposeActivityCode: z.string().min(1, 'Activity code is required'),
  usedBy: z.string().min(1, 'Used by is required'),
  date: z.date({ required_error: 'Date is required' }),
  remarks: z.string().optional(),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

export function StockConsumption() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stockItems = inventoryStore.getStockItems();

  const form = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      itemCode: '',
      quantityUsed: 0,
      purposeActivityCode: '',
      usedBy: 'Construction Team A',
      remarks: '',
    },
  });

  const selectedItemCode = form.watch('itemCode');
  const selectedItem = stockItems.find(item => item.itemCode === selectedItemCode);
  const quantityUsed = form.watch('quantityUsed');

  const onSubmit = async (data: ConsumptionFormValues) => {
    setIsSubmitting(true);
    try {
      const selectedItem = stockItems.find(item => item.itemCode === data.itemCode);
      
      if (!selectedItem) {
        toast({
          title: 'Error',
          description: 'Selected item not found',
          variant: 'destructive',
        });
        return;
      }

      if (selectedItem.currentQuantity < data.quantityUsed) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${selectedItem.currentQuantity} ${selectedItem.unit} available`,
          variant: 'destructive',
        });
        return;
      }

      const consumption = inventoryStore.addConsumption({
        itemCode: data.itemCode,
        itemName: selectedItem.itemName,
        quantityUsed: data.quantityUsed,
        unit: selectedItem.unit,
        purposeActivityCode: data.purposeActivityCode,
        usedBy: data.usedBy,
        date: data.date,
        remarks: data.remarks,
        createdBy: data.usedBy,
      });

      if (consumption) {
        toast({
          title: 'Stock Consumption Recorded',
          description: `Successfully consumed ${data.quantityUsed} ${selectedItem.unit} of ${selectedItem.itemName}`,
          variant: 'default',
        });

        form.reset();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to record consumption',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record stock consumption',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-primary" />
            Stock Consumption Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stockItems.map((item) => (
                          <SelectItem key={item.itemCode} value={item.itemCode}>
                            {item.itemCode} - {item.itemName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedItem && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Available Stock:</span>
                    <span>{selectedItem.currentQuantity} {selectedItem.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Rate per Unit:</span>
                    <span>₹{selectedItem.lastRate}</span>
                  </div>
                  {selectedItem.currentQuantity < 50 && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Low stock warning</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantityUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Used</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      {selectedItem && quantityUsed > selectedItem.currentQuantity && (
                        <p className="text-sm text-destructive">
                          Exceeds available stock ({selectedItem.currentQuantity} {selectedItem.unit})
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purposeActivityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose/Activity Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityCodes.map((code) => (
                            <SelectItem key={code.value} value={code.value}>
                              {code.value} - {code.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Used By</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Construction Team A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Foundation work - Block A"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isSubmitting || (selectedItem && quantityUsed > selectedItem.currentQuantity)}
              >
                {isSubmitting ? 'Recording Consumption...' : 'Record Consumption'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}