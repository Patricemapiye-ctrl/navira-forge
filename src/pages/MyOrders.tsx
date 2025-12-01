import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Calendar, ArrowLeft, Wrench } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  sale_date: string;
  payment_method: string;
  customer_name: string | null;
  customer_contact: string | null;
  user_id?: string | null;
  is_online?: boolean | null;
}

const MyOrders = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/shop");
        return;
      }

      const untypedClient = supabase as any;

      const { data, error } = await untypedClient
        .from("sales")
        .select("*");

      if (error) throw error;
      
      // Filter for user's online orders manually
      const userOrders = (data ?? []).filter((sale: any) =>
        sale.user_id === user.id && sale.is_online === true
      );
      
      setSales(userOrders as Sale[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch your orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <header className="bg-hardware-dark/90 backdrop-blur-sm border-b-2 border-primary shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-white">NAVIRA HARDWARE</h1>
                <p className="text-sm text-hardware-light">My Orders</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/shop")}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Receipt className="h-5 w-5" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-hardware-light text-center py-8">Loading your orders...</p>
            ) : sales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-hardware-light mb-4">You haven't placed any orders yet.</p>
                <Button
                  onClick={() => navigate("/shop")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20 hover:bg-hardware-steel/50">
                    <TableHead className="text-hardware-light">Order Number</TableHead>
                    <TableHead className="text-hardware-light">Date</TableHead>
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
                      <TableCell className="text-hardware-light capitalize">{sale.payment_method}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(Number(sale.total_amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MyOrders;
