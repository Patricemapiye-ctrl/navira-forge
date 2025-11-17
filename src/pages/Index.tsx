import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/auth");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hardware-dark via-hardware-steel to-hardware-metal">
      <div className="text-center text-white">
        <Wrench className="h-24 w-24 mx-auto mb-4 text-primary" />
        <h1 className="text-5xl font-bold mb-4">NAVIRA HARDWARE</h1>
        <p className="text-lg mb-8">Professional Hardware Management System</p>
        <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary hover:bg-primary/90">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
