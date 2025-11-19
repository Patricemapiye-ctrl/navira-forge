import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Wrench, Home } from "lucide-react";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { saleNumber, total, customerInfo } = location.state || {};

  if (!saleNumber) {
    navigate("/shop");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <header className="bg-hardware-dark/90 backdrop-blur-sm border-b-2 border-primary shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">NAVIRA HARDWARE</h1>
              <p className="text-sm text-hardware-light">Order Confirmation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-hardware-dark/50 border-primary/20">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl text-white mb-2">Order Placed Successfully!</CardTitle>
              <p className="text-hardware-light">Thank you for your purchase</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-hardware-steel/20 rounded-lg p-6 border border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-hardware-light mb-1">Order Number</p>
                    <p className="text-xl font-bold text-primary">{saleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-hardware-light mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-primary">${total?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-hardware-light mb-1">Customer Name</p>
                    <p className="text-white font-medium">{customerInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-hardware-light mb-1">Contact</p>
                    <p className="text-white font-medium">{customerInfo?.contact}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <p className="text-white text-center">
                  We'll contact you shortly to confirm your order and arrange delivery.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/shop")}
                  variant="outline"
                  className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Continue Shopping
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
