import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react";

interface SalesData {
  date: string;
  total: number;
  count: number;
}

interface CategoryData {
  category: string;
  value: number;
}

const COLORS = ['#FF6B35', '#F7931E', '#FDC830', '#00D9FF', '#7C3AED'];

const AnalyticsDashboard = () => {
  const [salesTrend, setSalesTrend] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch sales data for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("sale_date, total_amount")
        .gte("sale_date", sevenDaysAgo.toISOString())
        .order("sale_date", { ascending: true });

      if (salesError) throw salesError;

      // Process sales trend data
      const trendMap = new Map<string, { total: number; count: number }>();
      salesData?.forEach((sale) => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        const existing = trendMap.get(date) || { total: 0, count: 0 };
        trendMap.set(date, {
          total: existing.total + Number(sale.total_amount),
          count: existing.count + 1,
        });
      });

      const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count,
      }));
      setSalesTrend(trend);

      // Calculate total revenue and sales
      const revenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      setTotalRevenue(revenue);
      setTotalSales(salesData?.length || 0);

      // Fetch inventory by category
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("category, quantity, unit_price, reorder_level");

      if (inventoryError) throw inventoryError;

      const categoryMap = new Map<string, number>();
      inventoryData?.forEach((item) => {
        const existing = categoryMap.get(item.category) || 0;
        categoryMap.set(item.category, existing + item.quantity * Number(item.unit_price));
      });

      const categories = Array.from(categoryMap.entries()).map(([category, value]) => ({
        category,
        value,
      }));
      setCategoryData(categories);

      // Count low stock items
      const lowStock = inventoryData?.filter(
        (item) => item.quantity <= (item.reorder_level || 10)
      ).length || 0;
      setLowStockCount(lowStock);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-hardware-light">Total Revenue (7 days)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-hardware-light">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalSales}</div>
          </CardContent>
        </Card>

        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-hardware-light">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #FF6B35",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#FF6B35" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory by Category */}
        <Card className="bg-hardware-dark/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              Inventory Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #FF6B35",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Count by Day */}
        <Card className="bg-hardware-dark/50 border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShoppingCart className="h-5 w-5" />
              Daily Sales Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #FF6B35",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#FF6B35" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
