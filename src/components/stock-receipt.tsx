import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabaseInventoryStore } from '@/lib/supabase-store';
import { UnitOfMeasurement } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const units: UnitOfMeasurement[] = ['pcs', 'kg', 'm', 'm2', 'm3', 'ltr', 'box', 'bag', 'roll', 'ton'];

const receiptSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  quantityReceived: z.number().min(0.01, 'Quantity must be greater than 0'),
  ratePerUnit: z.number().min(0.01, 'Rate must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  deliveryDate: z.date({ required_error: 'Delivery date is required' }),
  receivedBy: z.string().min(1, 'Received by is required'),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

export function StockReceipt() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      itemName: '',
      itemCode: '',
      quantityReceived: 0,
      ratePerUnit: 0,
      unit: '',
      supplierName: '',
      receivedBy: 'John Supervisor',
    },
  });

  const watchedValues = form.watch(['quantityReceived', 'ratePerUnit']);
  const totalValue = (watchedValues[0] || 0) * (watchedValues[1] || 0);

  const onSubmit = async (data: ReceiptFormValues) => {
    setIsSubmitting(true);
    try {
      await supabaseInventoryStore.addReceipt({
        itemName: data.itemName,
        itemCode: data.itemCode,
        quantityReceived: data.quantityReceived,
        ratePerUnit: data.ratePerUnit,
        unit: data.unit,
        totalValue,
        supplierName: data.supplierName,
        deliveryDate: data.deliveryDate,
        receivedBy: data.receivedBy,
        createdBy: data.receivedBy,
      });

      toast({
        title: 'Stock Receipt Added',
        description: `Successfully received ${data.quantityReceived} ${data.unit} of ${data.itemName}`,
        variant: 'default',
      });

      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add stock receipt',
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
            <Plus className="h-5 w-5 text-primary" />
            Stock Receipt Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Portland Cement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CEM001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantityReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Received</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measurement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
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
                  name="ratePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate per Unit (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-primary">₹{totalValue.toLocaleString()}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC Suppliers Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date</FormLabel>
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

                <FormField
                  control={form.control}
                  name="receivedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received By</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Supervisor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Receipt...' : 'Add Stock Receipt'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}