import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Calendar, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface OnlineSale {
  id: string;
  sale_number: string;
  total_amount: number;
  sale_date: string;
  payment_method: string;
  customer_name: string | null;
  customer_contact: string | null;
}

const PendingOnlineSales = () => {
  const [sales, setSales] = useState<OnlineSale[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOnlineSales();

    // Set up realtime subscription for new online sales
    const channel = supabase
      .channel('online-sales')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: 'is_online=eq.true',
        },
        () => {
          fetchPendingOnlineSales();
          toast({
            title: "New Online Order",
            description: "A new online order has been placed!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingOnlineSales = async () => {
    const query = supabase
      .from("sales")
      .select("id, sale_number, total_amount, sale_date, payment_method, customer_name, customer_contact")
      .order("sale_date", { ascending: false })
      .limit(10);
    
    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch online orders.",
        variant: "destructive",
      });
    } else {
      // Filter for online sales
      const onlineSales = (data || []).filter((sale: any) => sale.is_online === true);
      setSales(onlineSales as OnlineSale[]);
    }
  };

  if (sales.length === 0) {
    return null;
  }

  return (
    <Card className="bg-hardware-dark/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ShoppingCart className="h-5 w-5" />
          Pending Online Orders
          <Badge variant="outline" className="ml-auto border-primary text-primary">
            {sales.length} New
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-hardware-steel/50">
              <TableHead className="text-hardware-light">Order #</TableHead>
              <TableHead className="text-hardware-light">Date</TableHead>
              <TableHead className="text-hardware-light">Customer</TableHead>
              <TableHead className="text-hardware-light">Contact</TableHead>
              <TableHead className="text-hardware-light">Payment</TableHead>
              <TableHead className="text-hardware-light text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="border-primary/10 hover:bg-hardware-steel/30">
                <TableCell className="font-medium text-white">{sale.sale_number}</TableCell>
                <TableCell className="text-hardware-light">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(sale.sale_date), "MMM dd, HH:mm")}
                  </div>
                </TableCell>
                <TableCell className="text-hardware-light">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {sale.customer_name || "N/A"}
                  </div>
                </TableCell>
                <TableCell className="text-hardware-light">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {sale.customer_contact || "N/A"}
                  </div>
                </TableCell>
                <TableCell className="text-hardware-light capitalize">{sale.payment_method}</TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {formatCurrency(Number(sale.total_amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PendingOnlineSales;
