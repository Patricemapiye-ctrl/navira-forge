import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, CreditCard, Banknote, Smartphone } from "lucide-react";
import { CartItem } from "@/components/ShoppingCart";
import { formatCurrency } from "@/lib/currency";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const cart: CartItem[] = location.state?.cart || [];

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    contact: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Generate sale number
      const { data: saleNumberData, error: saleNumberError } = await supabase.rpc(
        "generate_sale_number"
      );

      if (saleNumberError) throw saleNumberError;

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumberData,
          total_amount: total,
          payment_method: paymentMethod,
          customer_name: customerInfo.name,
          customer_contact: customerInfo.contact,
          sold_by: null, // Online order
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update inventory
      for (const item of cart) {
        // Insert sale item
        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: saleData.id,
          inventory_id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity,
        });

        if (itemError) throw itemError;

        // Update inventory quantity
        const { data: currentItem } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (currentItem) {
          await supabase
            .from("inventory")
            .update({ quantity: currentItem.quantity - item.quantity })
            .eq("id", item.id);
        }
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order number is ${saleNumberData}`,
      });

      navigate("/order-confirmation", {
        state: { saleNumber: saleNumberData, total, customerInfo },
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process order.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal flex items-center justify-center">
        <Card className="bg-hardware-dark/50 border-primary/20 max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-hardware-light mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/shop")} className="bg-primary hover:bg-primary/90">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <header className="bg-hardware-dark/90 backdrop-blur-sm border-b-2 border-primary shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-white">NAVIRA HARDWARE</h1>
                <p className="text-sm text-hardware-light">Checkout</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="bg-hardware-dark/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-hardware-light">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                        required
                        className="bg-hardware-steel/20 border-primary/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact" className="text-hardware-light">
                        Phone Number *
                      </Label>
                      <Input
                        id="contact"
                        type="tel"
                        value={customerInfo.contact}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, contact: e.target.value })
                        }
                        required
                        className="bg-hardware-steel/20 border-primary/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-hardware-light">
                        Email (Optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                        className="bg-hardware-steel/20 border-primary/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-hardware-light">Payment Method *</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 bg-hardware-steel/20 p-4 rounded-lg border border-primary/20">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer text-white">
                          <Banknote className="h-5 w-5 text-primary" />
                          Cash on Delivery
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-hardware-steel/20 p-4 rounded-lg border border-primary/20">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer text-white">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-hardware-steel/20 p-4 rounded-lg border border-primary/20">
                        <RadioGroupItem value="mobile" id="mobile" />
                        <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer text-white">
                          <Smartphone className="h-5 w-5 text-primary" />
                          Mobile Money
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    size="lg"
                  >
                    {isProcessing ? "Processing..." : `Place Order - ${formatCurrency(total)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-hardware-dark/50 border-primary/20 sticky top-24">
              <CardHeader>
                <CardTitle className="text-primary">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start pb-3 border-b border-primary/10"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.item_name}</p>
                        <p className="text-sm text-hardware-light">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
