import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, LogOut, Package, ShoppingCart, Users, Clock, User as UserIcon, Globe, RotateCcw, Settings } from "lucide-react";
import StockAlerts from "@/components/StockAlerts";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SalesHistory from "@/components/SalesHistory";
import OnlineSalesWidget from "@/components/OnlineSalesWidget";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">NAVIRA HARDWARE</h1>
              <p className="text-sm text-muted-foreground">Professional Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="flex items-center gap-2 text-primary font-mono text-2xl font-bold">
                <Clock className="h-6 w-6" />
                {formatTime(currentTime)}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
            </div>
            <ThemeToggle />
            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to the Dashboard</h2>
          <p className="text-muted-foreground">Select a module to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          <Card 
            className="hover:border-primary transition-all cursor-pointer group"
            onClick={() => navigate("/inventory")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">Manage hardware stock, add, edit, and delete items</p>
            </CardContent>
          </Card>

          {userRole === "employee" && (
            <Card 
              className="hover:border-green-500 transition-all cursor-pointer group"
              onClick={() => navigate("/sales")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <ShoppingCart className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Point of Sale</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Process customer sales and transactions</p>
              </CardContent>
            </Card>
          )}

          {(userRole === "admin" || userRole === "employee") && (
            <Card 
              className="hover:border-blue-500 transition-all cursor-pointer group"
              onClick={() => navigate("/online-orders")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Globe className="h-10 w-10 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Online Orders</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Manage pending online orders and fulfillment</p>
              </CardContent>
            </Card>
          )}

          {(userRole === "admin" || userRole === "employee") && (
            <Card 
              className="hover:border-orange-500 transition-all cursor-pointer group"
              onClick={() => navigate("/returns")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <RotateCcw className="h-10 w-10 text-orange-500" />
                </div>
                <CardTitle className="text-2xl">Returns & Refunds</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Process returns, refunds, and warranty claims</p>
              </CardContent>
            </Card>
          )}

          {userRole === "admin" && (
            <Card 
              className="hover:border-primary transition-all cursor-pointer group"
              onClick={() => navigate("/users")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">User Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Assign roles and manage users (Admin only)</p>
              </CardContent>
            </Card>
          )}

          {userRole === "admin" && (
            <Card 
              className="hover:border-purple-500 transition-all cursor-pointer group"
              onClick={() => navigate("/admin/company-settings")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Settings className="h-10 w-10 text-purple-500" />
                </div>
                <CardTitle className="text-2xl">Company Settings</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Manage company contact information</p>
              </CardContent>
            </Card>
          )}
        </div>

        <StockAlerts />

        <div className="mt-8">
          <OnlineSalesWidget />
        </div>

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
