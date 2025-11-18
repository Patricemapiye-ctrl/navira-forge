import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  sale_date: string;
  payment_method: string;
  customer_name: string | null;
  customer_contact: string | null;
}

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales history.",
        variant: "destructive",
      });
    } else {
      setSales(data || []);
    }
  };

  return (
    <Card className="bg-hardware-dark/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Receipt className="h-5 w-5" />
          Sales History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-hardware-steel/50">
              <TableHead className="text-hardware-light">Sale Number</TableHead>
              <TableHead className="text-hardware-light">Date</TableHead>
              <TableHead className="text-hardware-light">Customer</TableHead>
              <TableHead className="text-hardware-light">Payment Method</TableHead>
              <TableHead className="text-hardware-light text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="border-primary/10 hover:bg-hardware-steel/30">
                <TableCell className="font-medium text-white">{sale.sale_number}</TableCell>
                <TableCell className="text-hardware-light">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(sale.sale_date), "MMM dd, yyyy HH:mm")}
                  </div>
                </TableCell>
                <TableCell className="text-hardware-light">
                  {sale.customer_name || "Walk-in"}
                  {sale.customer_contact && (
                    <div className="text-xs text-hardware-light/70">{sale.customer_contact}</div>
                  )}
                </TableCell>
                <TableCell className="text-hardware-light capitalize">{sale.payment_method}</TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  ${Number(sale.total_amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SalesHistory;
