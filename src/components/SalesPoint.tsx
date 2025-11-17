import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Printer, Trash2 } from "lucide-react";
import Receipt from "@/components/Receipt";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
}

interface CartItem {
  inventory_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const SalesPoint = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lastSale, setLastSale] = useState<any>(null);
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .gt("quantity", 0)
      .order("item_name");
    setItems(data || []);
  };

  const addToCart = () => {
    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    if (quantity > item.quantity) {
      toast({
        title: "Error",
        description: "Not enough stock available.",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find((i) => i.inventory_id === item.id);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.inventory_id === item.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                subtotal: (i.quantity + quantity) * i.unit_price,
              }
            : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          inventory_id: item.id,
          item_name: item.item_name,
          quantity,
          unit_price: item.unit_price,
          subtotal: quantity * item.unit_price,
        },
      ]);
    }

    setSelectedItem("");
    setQuantity(1);
  };

  const removeFromCart = (inventory_id: string) => {
    setCart(cart.filter((item) => item.inventory_id !== inventory_id));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      const saleNumberResult = await supabase.rpc("generate_sale_number");
      const saleNumber = saleNumberResult.data;

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            sale_number: saleNumber,
            total_amount: getTotalAmount(),
            payment_method: paymentMethod,
            customer_name: customerName || null,
            customer_contact: customerContact || null,
            sold_by: user.user?.id,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        const inventoryItem = items.find((i) => i.id === item.inventory_id);
        if (inventoryItem) {
          await supabase
            .from("inventory")
            .update({ quantity: inventoryItem.quantity - item.quantity })
            .eq("id", item.inventory_id);
        }
      }

      setLastSale({ ...sale, items: cart });

      toast({
        title: "Success",
        description: `Sale completed. Sale Number: ${saleNumber}`,
      });

      setCart([]);
      setCustomerName("");
      setCustomerContact("");
      setPaymentMethod("cash");
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>body { font-family: Arial, sans-serif; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-2 border-hardware-steel/20">
        <CardHeader className="bg-hardware-dark/5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <CardTitle>Point of Sale</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Select Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} - R{item.unit_price} (Stock: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={addToCart} disabled={!selectedItem} className="w-full bg-primary hover:bg-primary/90">
              Add to Cart
            </Button>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <Label>Customer Name (Optional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Contact (Optional)</Label>
              <Input
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="Phone or email"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-hardware-steel/20">
        <CardHeader className="bg-hardware-dark/5">
          <CardTitle>Cart</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cart is empty</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.inventory_id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>R{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>R{item.subtotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.inventory_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">R{getTotalAmount().toFixed(2)}</span>
                </div>
                <Button
                  onClick={handleCompleteSale}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Complete Sale
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {lastSale && (
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/50">
            <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle>Last Sale Receipt</CardTitle>
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Receipt ref={receiptRef} sale={lastSale} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesPoint;
