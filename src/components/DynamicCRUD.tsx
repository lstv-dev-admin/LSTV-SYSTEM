import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileDown, Printer, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Column {
  key: string;
  label: string;
  editable?: boolean;
}

interface DynamicCRUDProps {
  tableName: "area" | "award";
  title: string;
  columns: Column[];
  itemsPerPage?: number;
}

export const DynamicCRUD = ({ tableName, title, columns, itemsPerPage = 10 }: DynamicCRUDProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  const editableColumns = columns.filter(col => col.editable !== false);

  useEffect(() => {
    fetchItems();
  }, [currentPage]);

  const fetchItems = async () => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from(tableName)
      .select("*", { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
      setTotalItems(count || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      const { error } = await supabase
        .from(tableName as any)
        .update(formData as any)
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${title} updated successfully` });
        setIsDialogOpen(false);
        resetForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase.from(tableName as any).insert([formData as any]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${title} created successfully` });
        setIsDialogOpen(false);
        resetForm();
        fetchItems();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${title} deleted successfully` });
      fetchItems();
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const data: Record<string, any> = {};
    editableColumns.forEach(col => {
      data[col.key] = item[col.key];
    });
    setFormData(data);
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
    XLSX.writeFile(workbook, `${tableName}_${Date.now()}.xlsx`);
    toast({ title: "Success", description: "Exported to Excel successfully" });
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    
    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: items.map(item => columns.map(col => item[col.key] || "")),
      startY: 20,
    });
    
    doc.save(`${tableName}_${Date.now()}.pdf`);
    toast({ title: "Success", description: "PDF generated successfully" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { error } = await supabase.from(tableName as any).insert(jsonData as any);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Imported ${jsonData.length} records` });
        fetchItems();
      }
    };
    reader.readAsBinaryString(file);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileDown className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" onClick={printPDF}>
            <Printer className="mr-2 h-4 w-4" /> Print PDF
          </Button>
          <label htmlFor={`import-${tableName}`}>
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" /> Import
              </span>
            </Button>
          </label>
          <input
            id={`import-${tableName}`}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" /> Add {title}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Add"} {title}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editableColumns.map(col => (
                  <div key={col.key}>
                    <label className="text-sm font-medium">{col.label}</label>
                    <Input
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {col.key.includes("_at") 
                      ? new Date(item[col.key]).toLocaleString()
                      : item[col.key]}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
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