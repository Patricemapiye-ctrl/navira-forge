import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, Edit } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const UserManagement = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [newRole, setNewRole] = useState<string>("employee");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user roles.",
        variant: "destructive",
      });
    } else {
      setUserRoles(data || []);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check role limits
      const adminCount = userRoles.filter(r => r.role === 'admin').length;
      const employeeCount = userRoles.filter(r => r.role === 'employee').length;

      if (role === 'admin' && adminCount >= 2) {
        toast({
          title: "Limit Reached",
          description: "Maximum of 2 admins allowed.",
          variant: "destructive",
        });
        return;
      }

      if (role === 'employee' && employeeCount >= 5) {
        toast({
          title: "Limit Reached",
          description: "Maximum of 5 employees allowed.",
          variant: "destructive",
        });
        return;
      }

      const { data, error: queryError } = await supabase.auth.admin.listUsers();
      
      if (queryError) throw queryError;

      const user = data.users.find((u: any) => u.email === email);
      
      if (!user) {
        toast({
          title: "Error",
          description: "User with this email not found.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: user.id, role: role as "admin" | "employee" }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role assigned successfully.",
      });

      setOpen(false);
      setEmail("");
      setRole("employee");
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (userRole: UserRole) => {
    setEditingRole(userRole);
    setNewRole(userRole.role);
    setEditOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRole) return;

    try {
      // Check role limits
      const adminCount = userRoles.filter(r => r.role === 'admin' && r.id !== editingRole.id).length;
      const employeeCount = userRoles.filter(r => r.role === 'employee' && r.id !== editingRole.id).length;

      if (newRole === 'admin' && adminCount >= 2) {
        toast({
          title: "Limit Reached",
          description: "Maximum of 2 admins allowed.",
          variant: "destructive",
        });
        return;
      }

      if (newRole === 'employee' && employeeCount >= 5) {
        toast({
          title: "Limit Reached",
          description: "Maximum of 5 employees allowed.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "employee" })
        .eq("id", editingRole.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      setEditOpen(false);
      setEditingRole(null);
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user role?")) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User role removed successfully.",
      });
      fetchUserRoles();
    }
  };

  return (
    <Card className="border-2 border-hardware-steel/20">
      <CardHeader className="bg-hardware-dark/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle>User Management</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign User Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label>User Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Assign Role
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <Label>User ID</Label>
                  <Input
                    value={editingRole?.user_id || ""}
                    disabled
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Update Role
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-hardware-dark/5">
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles.map((userRole) => (
              <TableRow key={userRole.id}>
                <TableCell className="font-mono text-xs">{userRole.user_id}</TableCell>
                <TableCell>
                  <span className="uppercase font-semibold text-primary">
                    {userRole.role}
                  </span>
                </TableCell>
                <TableCell>{new Date(userRole.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(userRole)}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(userRole.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
