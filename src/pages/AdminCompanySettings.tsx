import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CompanyData {
  id: string;
  email: string;
  landline: string;
  cell_number: string;
  address: string;
  city: string;
  country: string;
  google_maps_url: string;
  weekday_hours: string;
  saturday_hours: string;
  sunday_hours: string;
}

const AdminCompanySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData>({
    id: "",
    email: "",
    landline: "",
    cell_number: "",
    address: "",
    city: "",
    country: "",
    google_maps_url: "",
    weekday_hours: "8:00 AM - 6:00 PM",
    saturday_hours: "8:00 AM - 4:00 PM",
    sunday_hours: "Closed",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCompanyInfo();
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

    if (!roleData || roleData.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only admins can access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("company_info")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setCompanyData(data);
    } catch (error: any) {
      console.error("Error fetching company info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const updateData = {
        email: companyData.email,
        landline: companyData.landline,
        cell_number: companyData.cell_number,
        address: companyData.address,
        city: companyData.city,
        country: companyData.country,
        google_maps_url: companyData.google_maps_url,
        weekday_hours: companyData.weekday_hours,
        saturday_hours: companyData.saturday_hours,
        sunday_hours: companyData.sunday_hours,
        updated_at: new Date().toISOString(),
        updated_by: session?.user.id,
      };

      if (companyData.id) {
        const { error } = await (supabase as any)
          .from("company_info")
          .update(updateData)
          .eq("id", companyData.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("company_info")
          .insert(updateData);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update company info",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">NAVIRA HARDWARE</h1>
              <p className="text-sm text-muted-foreground">Company Settings</p>
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="landline">Landline</Label>
                  <Input
                    id="landline"
                    value={companyData.landline}
                    onChange={(e) => handleChange("landline", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cell_number">Cell Number</Label>
                  <Input
                    id="cell_number"
                    value={companyData.cell_number}
                    onChange={(e) => handleChange("cell_number", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companyData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={companyData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={companyData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_maps_url">Google Maps URL</Label>
                <Input
                  id="google_maps_url"
                  value={companyData.google_maps_url}
                  onChange={(e) => handleChange("google_maps_url", e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-4">Business Hours</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekday_hours">Monday - Friday</Label>
                    <Input
                      id="weekday_hours"
                      value={companyData.weekday_hours}
                      onChange={(e) => handleChange("weekday_hours", e.target.value)}
                      placeholder="8:00 AM - 6:00 PM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturday_hours">Saturday</Label>
                    <Input
                      id="saturday_hours"
                      value={companyData.saturday_hours}
                      onChange={(e) => handleChange("saturday_hours", e.target.value)}
                      placeholder="8:00 AM - 4:00 PM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday_hours">Sunday</Label>
                    <Input
                      id="sunday_hours"
                      value={companyData.sunday_hours}
                      onChange={(e) => handleChange("sunday_hours", e.target.value)}
                      placeholder="Closed"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminCompanySettings;