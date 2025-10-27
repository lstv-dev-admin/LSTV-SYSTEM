import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit, FileDown, FileUp, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  editable?: boolean;
}

interface DynamicCRUDProps {
  tableName: string;
  title: string;
  columns: Column[];
  itemsPerPage?: number;
}

export const DynamicCRUD = ({ tableName, title, columns, itemsPerPage = 10 }: DynamicCRUDProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const fetchItems = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from(tableName as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error(`Failed to fetch ${title.toLowerCase()}`);
      setLoading(false);
      return;
    }

    setItems(data || []);
    setTotalItems(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editableData = columns
      .filter(col => col.editable !== false && col.key !== "id")
      .reduce((acc, col) => ({ ...acc, [col.key]: formData[col.key] }), {});

    if (editingItem) {
      const { error } = await supabase
        .from(tableName as any)
        .update(editableData)
        .eq("id", editingItem.id);

      if (error) {
        toast.error(`Failed to update ${title.toLowerCase()}`);
        return;
      }
      toast.success(`${title} updated successfully`);
    } else {
      const { error } = await supabase.from(tableName as any).insert([editableData]);

      if (error) {
        toast.error(`Failed to create ${title.toLowerCase()}`);
        return;
      }
      toast.success(`${title} created successfully`);
    }

    setIsDialogOpen(false);
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);

    if (error) {
      toast.error(`Failed to delete ${title.toLowerCase()}`);
      return;
    }

    toast.success(`${title} deleted successfully`);
    fetchItems();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({});
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title}_${new Date().toISOString()}.xlsx`);
    toast.success("Exported to Excel successfully");
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);

    const tableData = items.map(item =>
      columns.map(col => {
        const value = item[col.key];
        if (col.type === "date" && value) {
          return new Date(value).toLocaleDateString();
        }
        return value || "";
      })
    );

    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 20,
    });

    doc.save(`${title}_${new Date().toISOString()}.pdf`);
    toast.success("PDF generated successfully");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const importData = jsonData.map((row: any) => {
        const item: any = {};
        columns.forEach(col => {
          if (col.key !== "id" && col.editable !== false) {
            item[col.key] = row[col.label] || row[col.key];
          }
        });
        return item;
      });

      const { error } = await supabase.from(tableName as any).insert(importData);

      if (error) {
        toast.error("Failed to import data");
        return;
      }

      toast.success(`Successfully imported ${importData.length} records`);
      fetchItems();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={printPDF} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print PDF
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <FileUp className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Add New"} {title}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {columns.filter(col => col.editable !== false && col.key !== "id").map(col => (
                  <div key={col.key}>
                    <label className="text-sm font-medium">{col.label}</label>
                    <Input
                      type={col.type || "text"}
                      value={formData[col.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {col.type === "date" && item[col.key]
                        ? new Date(item[col.key]).toLocaleDateString()
                        : item[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
