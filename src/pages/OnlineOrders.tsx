import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, Package, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatCurrency } from "@/lib/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  sale_number: string;
  customer_name: string;
  customer_contact: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

interface SaleItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const OnlineOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<SaleItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "employee")) {
      navigate("/dashboard");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("sales")
        .select("*")
        .eq("is_online", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (saleId: string) => {
    const { data, error } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", saleId);

    if (!error && data) {
      setOrderItems(data);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setShowDetails(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await (supabase as any)
        .from("sales")
        .update({ 
          status: newStatus,
          handled_by: session?.user.id,
          handled_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Order marked as ${newStatus}`,
      });

      fetchOrders();
      setShowDetails(false);

      // Mock email notification
      console.log(`[MOCK EMAIL] Order ${orderId} status changed to ${newStatus}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">NAVIRA HARDWARE</h1>
              <p className="text-sm text-muted-foreground">Online Orders Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Online Orders</h2>
            {pendingCount > 0 && (
              <Badge className="bg-primary text-primary-foreground animate-pulse-glow">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No online orders yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className={order.status === "pending" ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}>
                      <TableCell className="font-mono">{order.sale_number}</TableCell>
                      <TableCell>{order.customer_name || "N/A"}</TableCell>
                      <TableCell>{order.customer_contact || "N/A"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.sale_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedOrder.customer_contact || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right text-lg font-bold">
                Total: {formatCurrency(selectedOrder.total_amount)}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedOrder?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
                <Button onClick={() => updateOrderStatus(selectedOrder.id, "completed")} className="bg-success hover:bg-success/90">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineOrders;