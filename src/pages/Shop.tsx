import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ShoppingCart as CartIcon, Search, Package, ArrowLeft, User, History, Building } from "lucide-react";
import ShoppingCart, { CartItem } from "@/components/ShoppingCart";
import { formatCurrency } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AIToolHelper from "@/components/AIToolHelper";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Product {
  id: string;
  item_name: string;
  item_code: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
}

const Shop = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [user, setUser] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetchProducts();
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const fetchProducts = async () => {
    // Fetch products without requiring authentication
    const { data, error } = await supabase
      .from("inventory")
      .select("id, item_name, item_code, description, category, quantity, unit_price")
      .gt("quantity", 0)
      .order("item_name");

    if (error) {
      console.error("Error fetching products:", error);
      // Don't show error to users - products will display empty
      setProducts([]);
      setFilteredProducts([]);
    } else {
      setProducts(data || []);
      setFilteredProducts(data || []);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast({
          title: "Out of Stock",
          description: `Only ${product.quantity} units available.`,
          variant: "destructive",
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          item_name: product.item_name,
          item_code: product.item_code,
          unit_price: Number(product.unit_price),
          quantity: 1,
          available_stock: product.quantity,
        },
      ]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.item_name} added to your cart.`,
    });
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast({
      title: "Removed",
      description: "Item removed from cart.",
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to your cart first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    navigate("/checkout", { state: { cart } });
  };

  const handleAuth = async () => {
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/shop`,
            data: {
              name,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
        setShowAuthDialog(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome Back",
          description: "You've successfully logged in.",
        });
        setShowAuthDialog(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You've been logged out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">NAVIRA HARDWARE</h1>
                <p className="text-sm text-muted-foreground">Online Store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                onClick={() => navigate("/company-info")}
                variant="outline"
                size="sm"
              >
                <Building className="h-3 w-3 mr-1.5" />
                Contact
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {user ? (
                <>
                  <Button
                    onClick={() => navigate("/my-orders")}
                    variant="outline"
                  >
                    <History className="h-4 w-4 mr-2" />
                    My Orders
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                  <ShoppingCart
                    items={cart}
                    onUpdateQuantity={updateCartQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={handleCheckout}
                  />
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthDialog(true);
                    }}
                    variant="outline"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <ShoppingCart
                    items={cart}
                    onUpdateQuantity={updateCartQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={handleCheckout}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <Card className="bg-hardware-dark/50 border-primary/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-hardware-light" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-hardware-steel/20 border-primary/20 text-white"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-hardware-steel/20 border-primary/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-hardware-dark border-primary/20">
                    {categories.map((category) => (
                      <SelectItem 
                        key={category} 
                        value={category}
                        className="text-white hover:bg-hardware-steel/50"
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="bg-hardware-dark/50 border-primary/20 hover:border-primary/50 transition-all group"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">{product.item_name}</CardTitle>
                    <p className="text-sm text-hardware-light">{product.item_code}</p>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-hardware-light mb-4 min-h-[40px]">
                  {product.description || "Quality hardware product"}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(Number(product.unit_price))}</p>
                    <p className="text-xs text-hardware-light flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {product.quantity} in stock
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={product.quantity === 0}
                >
                  <CartIcon className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-hardware-light opacity-50" />
            <p className="text-hardware-light text-lg">No products found</p>
          </div>
        )}
      </main>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-hardware-dark border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {authMode === "signup" ? "Create Account" : "Login"}
            </DialogTitle>
            <DialogDescription className="text-hardware-light">
              {authMode === "signup"
                ? "Create an account to complete your purchase"
                : "Login to continue shopping"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {authMode === "signup" && (
              <div>
                <label className="text-sm text-hardware-light mb-1 block">Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-hardware-steel/20 border-primary/20 text-white"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-hardware-light mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-hardware-steel/20 border-primary/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-hardware-light mb-1 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-hardware-steel/20 border-primary/20 text-white"
              />
            </div>
            <Button
              onClick={handleAuth}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {authMode === "signup" ? "Create Account" : "Login"}
            </Button>
            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                className="text-sm text-primary hover:underline"
              >
                {authMode === "signup"
                  ? "Already have an account? Login"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIToolHelper products={products} />
    </div>
  );
};

export default Shop;
