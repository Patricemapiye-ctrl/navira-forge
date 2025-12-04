import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, Mail, Phone, MapPin, Building } from "lucide-react";
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
}

const CompanyInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("company_info")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCompanyData(data);
    } catch (error: any) {
      console.error("Error fetching company info:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">NAVIRA HARDWARE</h1>
              <p className="text-sm text-muted-foreground">Contact Us</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !companyData ? (
          <div className="text-center py-12 text-muted-foreground">Company information not available</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${companyData.email}`} className="text-lg font-medium text-primary hover:underline">
                    {companyData.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Phone className="h-6 w-6 text-primary mt-0.5" />
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Landline</p>
                    <a href={`tel:${companyData.landline}`} className="text-lg font-medium hover:text-primary">
                      {companyData.landline}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cell Phone</p>
                    <a href={`tel:${companyData.cell_number}`} className="text-lg font-medium hover:text-primary">
                      {companyData.cell_number}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <MapPin className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-lg font-medium">{companyData.address}</p>
                  <p className="text-muted-foreground">{companyData.city}, {companyData.country}</p>
                  {companyData.google_maps_url && (
                    <a 
                      href={companyData.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm mt-2 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-4">Business Hours</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Monday - Friday:</p>
                  <p className="font-medium">8:00 AM - 6:00 PM</p>
                  <p>Saturday:</p>
                  <p className="font-medium">8:00 AM - 4:00 PM</p>
                  <p>Sunday:</p>
                  <p className="font-medium">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CompanyInfo;