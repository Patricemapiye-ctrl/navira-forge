import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, LogOut, Package, ShoppingCart, Users, Clock } from "lucide-react";
import StockAlerts from "@/components/StockAlerts";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SalesHistory from "@/components/SalesHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkAuth();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

    setUserRole(roleData?.role || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <header className="bg-hardware-dark/90 backdrop-blur-sm border-b-2 border-primary shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">NAVIRA HARDWARE</h1>
              <p className="text-sm text-hardware-light">Professional Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 text-primary font-mono text-2xl font-bold">
                <Clock className="h-6 w-6" />
                {formatTime(currentTime)}
              </div>
              <p className="text-sm text-hardware-light">{formatDate(currentTime)}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to the Dashboard</h2>
          <p className="text-hardware-light">Select a module to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          <Card 
            className="border-2 border-hardware-steel/20 bg-hardware-dark/30 backdrop-blur-sm hover:border-primary transition-all cursor-pointer group"
            onClick={() => navigate("/inventory")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-white">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-hardware-light">Manage hardware stock, add, edit, and delete items</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-hardware-steel/20 bg-hardware-dark/30 backdrop-blur-sm hover:border-primary transition-all cursor-pointer group"
            onClick={() => navigate("/sales")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-white">Point of Sale</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-hardware-light">Process sales and generate receipts</p>
            </CardContent>
          </Card>

          {userRole === "ceo" && (
            <Card 
              className="border-2 border-hardware-steel/20 bg-hardware-dark/30 backdrop-blur-sm hover:border-primary transition-all cursor-pointer group"
              onClick={() => navigate("/users")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-hardware-light">Assign roles and manage users (CEO only)</p>
              </CardContent>
            </Card>
          )}
        </div>

        <StockAlerts />

        <div className="mt-8">
          <AnalyticsDashboard />
        </div>

        <div className="mt-8">
          <SalesHistory />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
