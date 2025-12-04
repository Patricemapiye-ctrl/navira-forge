import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatCurrency } from "@/lib/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Return {
  id: string;
  sale_id: string;
  reason: string;
  status: string;
  refund_amount: number;
  warranty_claim: boolean;
  created_at: string;
  notes: string;
}

const Returns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processingNotes, setProcessingNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    checkAuth();
    fetchReturns();
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

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "employee")) {
      navigate("/dashboard");
    }
  };

  const fetchReturns = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("returns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load returns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReturn = async (status: string) => {
    if (!selectedReturn) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await (supabase as any)
        .from("returns")
        .update({
          status,
          refund_amount: refundAmount ? parseFloat(refundAmount) : null,
          notes: processingNotes,
          processed_by: session?.user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedReturn.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Return ${status}`,
      });

      // Mock email notification
      console.log(`[MOCK EMAIL] Return ${selectedReturn.id} has been ${status}`);

      fetchReturns();
      setShowDetails(false);
      setProcessingNotes("");
      setRefundAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process return",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
              <p className="text-sm text-muted-foreground">Returns & Refunds</p>
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Returns & Warranty Claims</h2>
          <Button onClick={fetchReturns} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : returns.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No returns or warranty claims
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-mono text-sm">{ret.id.slice(0, 8)}...</TableCell>
                      <TableCell className="max-w-xs truncate">{ret.reason}</TableCell>
                      <TableCell>
                        {ret.warranty_claim ? (
                          <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Warranty</Badge>
                        ) : (
                          <Badge variant="outline">Return</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(ret.status)}</TableCell>
                      <TableCell>{new Date(ret.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReturn(ret);
                            setShowDetails(true);
                          }}
                        >
                          Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              <div>
                <Label>Reason for Return</Label>
                <p className="text-sm bg-muted p-2 rounded mt-1">{selectedReturn.reason}</p>
              </div>

              <div>
                <Label>Type</Label>
                <p className="text-sm mt-1">
                  {selectedReturn.warranty_claim ? "Warranty Claim" : "Regular Return"}
                </p>
              </div>

              <div>
                <Label htmlFor="refund">Refund Amount ($)</Label>
                <Input
                  id="refund"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                />
              </div>

              <div>
                <Label htmlFor="notes">Processing Notes</Label>
                <Textarea
                  id="notes"
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  placeholder="Add any notes about this return..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => processReturn("rejected")}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => processReturn("approved")} className="bg-success hover:bg-success/90">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Returns;