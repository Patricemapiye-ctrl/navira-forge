import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Package } from "lucide-react";

interface LowStockItem {
  id: string;
  item_name: string;
  item_code: string;
  category: string;
  quantity: number;
  reorder_level: number;
  unit_price: number;
}

const StockAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLowStockItems();

    // Set up real-time subscription for inventory changes
    const subscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          fetchLowStockItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLowStockItems = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("quantity", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch low stock items.",
        variant: "destructive",
      });
    } else {
      // Filter items where quantity is at or below reorder level
      const lowStock = data?.filter(
        (item) => item.quantity <= (item.reorder_level || 10)
      ) || [];
      setLowStockItems(lowStock);
    }
  };

  if (lowStockItems.length === 0) {
    return (
      <Alert className="bg-hardware-dark/50 border-primary/20">
        <Package className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">All Stock Levels Good</AlertTitle>
        <AlertDescription className="text-hardware-light">
          No items currently require restocking.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-hardware-dark/50 border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alerts ({lowStockItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-destructive/10 border-destructive/50">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Attention Required</AlertTitle>
          <AlertDescription className="text-hardware-light">
            The following items are at or below their reorder level and need to be restocked.
          </AlertDescription>
        </Alert>

        <Table>
          <TableHeader>
            <TableRow className="border-destructive/20 hover:bg-hardware-steel/50">
              <TableHead className="text-hardware-light">Item Code</TableHead>
              <TableHead className="text-hardware-light">Item Name</TableHead>
              <TableHead className="text-hardware-light">Category</TableHead>
              <TableHead className="text-hardware-light text-right">Current Stock</TableHead>
              <TableHead className="text-hardware-light text-right">Reorder Level</TableHead>
              <TableHead className="text-hardware-light text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lowStockItems.map((item) => {
              const percentageLeft = (item.quantity / item.reorder_level) * 100;
              const isCritical = item.quantity === 0;
              const isVeryLow = percentageLeft <= 50;

              return (
                <TableRow 
                  key={item.id} 
                  className={`border-destructive/10 ${
                    isCritical 
                      ? 'bg-destructive/20 hover:bg-destructive/30' 
                      : isVeryLow 
                      ? 'bg-destructive/10 hover:bg-destructive/20'
                      : 'hover:bg-hardware-steel/30'
                  }`}
                >
                  <TableCell className="font-medium text-white">{item.item_code}</TableCell>
                  <TableCell className="text-hardware-light">{item.item_name}</TableCell>
                  <TableCell className="text-hardware-light">{item.category}</TableCell>
                  <TableCell className={`text-right font-semibold ${
                    isCritical ? 'text-destructive' : isVeryLow ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-hardware-light">{item.reorder_level}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      isCritical 
                        ? 'bg-destructive text-white' 
                        : isVeryLow 
                        ? 'bg-orange-500 text-white'
                        : 'bg-yellow-500 text-hardware-dark'
                    }`}>
                      {isCritical ? 'OUT OF STOCK' : isVeryLow ? 'VERY LOW' : 'LOW'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StockAlerts;
