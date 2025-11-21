import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, ShoppingBag, LogIn } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <header className="bg-hardware-dark/90 backdrop-blur-sm border-b-2 border-primary shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">NAVIRA HARDWARE</h1>
              <p className="text-sm text-hardware-light">Your Trusted Hardware Partner</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Welcome to NAVIRA HARDWARE</h2>
          <p className="text-xl text-hardware-light max-w-2xl mx-auto">
            Quality hardware products for all your construction and repair needs
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="bg-hardware-dark/50 border-primary/20 hover:border-primary transition-all cursor-pointer group hover:scale-105 max-w-2xl w-full" onClick={() => navigate("/shop")}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl text-white">Shop Online</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-hardware-light text-lg mb-6">
                Browse our wide selection of hardware products and place your order online
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-white" size="lg">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Staff Portal Icon - Bottom Right */}
        <Button
          onClick={() => navigate("/auth")}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-hardware-dark/90 border-2 border-primary/30 hover:border-primary hover:bg-primary/20 transition-all shadow-lg"
          size="icon"
          title="Staff Portal"
        >
          <LogIn className="h-5 w-5 text-primary" />
        </Button>

        <div className="mt-16 text-center">
          
        </div>
      </main>
    </div>;
};
export default Index;