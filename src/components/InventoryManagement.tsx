import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  reorder_level: number;
}

interface InventoryManagementProps {
  userRole: string | null;
}

const InventoryManagement = ({ userRole }: InventoryManagementProps) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    item_name: "",
    item_code: "",
    description: "",
    category: "",
    quantity: 0,
    unit_price: 0,
    supplier: "",
    reorder_level: 10,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("item_name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory items.",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      const { error } = await supabase
        .from("inventory")
        .update(formData)
        .eq("id", editingItem.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
        setOpen(false);
        resetForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase.from("inventory").insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item added successfully.",
        });
        setOpen(false);
        resetForm();
        fetchItems();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
      fetchItems();
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: "",
      item_code: "",
      description: "",
      category: "",
      quantity: 0,
      unit_price: 0,
      supplier: "",
      reorder_level: 10,
    });
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      item_code: item.item_code,
      description: item.description || "",
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      supplier: item.supplier || "",
      reorder_level: item.reorder_level,
    });
    setOpen(true);
  };

  const canEdit = userRole === "ceo" || userRole === "employee";
  const canDelete = userRole === "ceo";

  return (
    <Card className="border-2 border-hardware-steel/20">
      <CardHeader className="bg-hardware-dark/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle>Inventory Management</CardTitle>
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Item Name</Label>
                      <Input
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Item Code</Label>
                      <Input
                        value={formData.item_code}
                        onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Supplier</Label>
                      <Input
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Reorder Level</Label>
                      <Input
                        type="number"
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      {editingItem ? "Update" : "Add"} Item
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-hardware-dark/5">
                <TableHead>Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Supplier</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.quantity <= item.reorder_level ? "bg-destructive/10" : ""}>
                  <TableCell className="font-mono">{item.item_code}</TableCell>
                  <TableCell className="font-semibold">{item.item_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>R{item.unit_price.toFixed(2)}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryManagement;
