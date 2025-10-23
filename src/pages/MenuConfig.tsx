import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const menuItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(200).optional(),
  icon: z.string().max(50).optional(),
  path: z.string().min(1, "Path is required").max(100),
  display_order: z.number().min(0),
});

type MenuItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  path: string;
  display_order: number;
  is_active: boolean;
  visible_to_roles: string[];
};

export default function MenuConfig() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "",
    path: "",
    display_order: 0,
    is_active: true,
    visible_to_admin: true,
    visible_to_user: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to fetch menu items");
      return;
    }
    setMenuItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      menuItemSchema.parse({
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        path: formData.path,
        display_order: formData.display_order,
      });

      const visibleToRoles = [];
      if (formData.visible_to_admin) visibleToRoles.push("admin");
      if (formData.visible_to_user) visibleToRoles.push("user");

      const menuData = {
        title: formData.title,
        description: formData.description || null,
        icon: formData.icon || null,
        path: formData.path,
        display_order: formData.display_order,
        is_active: formData.is_active,
        visible_to_roles: visibleToRoles,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(menuData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Menu item updated successfully!");
      } else {
        const { error } = await supabase.from("menu_items").insert([menuData]);

        if (error) throw error;
        toast.success("Menu item added successfully!");
      }

      setOpen(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error("Failed to save menu item");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete menu item");
      return;
    }

    toast.success("Menu item deleted successfully!");
    fetchMenuItems();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      icon: item.icon || "",
      path: item.path,
      display_order: item.display_order,
      is_active: item.is_active,
      visible_to_admin: item.visible_to_roles.includes("admin"),
      visible_to_user: item.visible_to_roles.includes("user"),
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "",
      path: "",
      display_order: menuItems.length,
      is_active: true,
      visible_to_admin: true,
      visible_to_user: true,
    });
    setEditingItem(null);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Configuration</h1>
          <p className="text-muted-foreground">
            Customize navigation menu items and permissions
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
              <DialogDescription>
                Configure menu item details and visibility
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="e.g., LayoutDashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="path">Path *</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) =>
                    setFormData({ ...formData, path: e.target.value })
                  }
                  placeholder="/dashboard"
                  required
                />
                {errors.path && (
                  <p className="text-sm text-destructive">{errors.path}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-3">
                <Label>Visible to Roles</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin"
                    checked={formData.visible_to_admin}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        visible_to_admin: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="admin" className="font-normal">
                    Admin
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="user"
                    checked={formData.visible_to_user}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        visible_to_user: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="user" className="font-normal">
                    User
                  </Label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked === true })
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  Active
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? "Update" : "Add"} Menu Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Visible To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No menu items found
                </TableCell>
              </TableRow>
            ) : (
              menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="font-mono text-sm">{item.path}</TableCell>
                  <TableCell>{item.icon || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.visible_to_roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
