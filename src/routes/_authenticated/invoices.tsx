import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Download, FileText, DollarSign, Calendar, Building2, CheckCircle2, Clock, XCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesPage,
});

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft:     { label: "Draft",     variant: "secondary",   color: "text-muted-foreground" },
  sent:      { label: "Sent",      variant: "outline",     color: "text-blue-500" },
  paid:      { label: "Paid",      variant: "default",     color: "text-green-500" },
  overdue:   { label: "Overdue",   variant: "destructive", color: "text-red-500" },
  cancelled: { label: "Cancelled", variant: "outline",     color: "text-muted-foreground" },
};

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

function InvoicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: "none", project_id: "none", amount: "",
    currency: "INR", due_date: "", notes: "", status: "draft",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, company").order("name");
      return (data ?? []) as any[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("projects").select("id, name, client_id").order("name");
      return (data ?? []) as any[];
    },
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("*, clients(name, company), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const saveInvoice = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        client_id: form.client_id === "none" ? null : form.client_id,
        project_id: form.project_id === "none" ? null : form.project_id,
        amount: Number(form.amount),
        currency: form.currency,
        due_date: form.due_date || null,
        notes: form.notes || null,
        status: form.status,
      };

      if (editInvoiceId) {
        const { error } = await (supabase as any).from("invoices").update(payload).eq("id", editInvoiceId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("invoices").insert({ ...payload, created_by: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editInvoiceId ? "Invoice updated" : "Invoice created");
      setOpen(false);
      setEditInvoiceId(null);
      setForm({ client_id: "none", project_id: "none", amount: "", currency: "INR", due_date: "", notes: "", status: "draft" });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(inv: any) {
    setForm({
      client_id: inv.client_id || "none",
      project_id: inv.project_id || "none",
      amount: inv.amount ? String(inv.amount) : "",
      currency: inv.currency || "INR",
      due_date: inv.due_date || "",
      notes: inv.notes || "",
      status: inv.status || "draft",
    });
    setEditInvoiceId(inv.id);
    setOpen(true);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setEditInvoiceId(null);
      setForm({ client_id: "none", project_id: "none", amount: "", currency: "INR", due_date: "", notes: "", status: "draft" });
    }
  }

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["invoices"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function exportCSV() {
    if (invoices.length === 0) return toast.error("No invoices to export");
    const headers = ["Invoice No", "Client", "Project", "Amount", "Currency", "Status", "Due Date", "Created"];
    const rows = invoices.map((inv: any) => [
      inv.invoice_number, inv.clients?.name ?? "", inv.projects?.name ?? "",
      inv.amount, inv.currency, inv.status,
      inv.due_date ?? "", new Date(inv.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported invoices.csv");
  }

  const filtered = filterStatus === "all" ? invoices : invoices.filter((i: any) => i.status === filterStatus);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalPending = invoices.filter((i: any) => ["draft", "sent"].includes(i.status)).reduce((s: number, i: any) => s + Number(i.amount), 0);
  const overdueCount = invoices.filter((i: any) => i.status === "overdue").length;
  const clientProjects = form.client_id === "none" ? projects : projects.filter((p: any) => p.client_id === form.client_id);

  return (
    <div className="space-y-6">
      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete invoice?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteInvoice.mutate(deleteId!)} disabled={deleteInvoice.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Auto-numbered from LIZ-001 · {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="size-4 mr-2" />Export CSV</Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => { handleOpenChange(false); setOpen(true); }}>
                <Plus className="size-4 mr-2" />New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editInvoiceId ? "Edit Invoice" : "Create Invoice"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v, project_id: "none" })}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Client —</SelectItem>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Project <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Project —</SelectItem>
                      {clientProjects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount *</Label>
                    <div className="relative">
                      <DollarSign className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" className="pl-9" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">₹ INR</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GBP">£ GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <div className="relative">
                      <Calendar className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="date" className="pl-9" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Invoice notes or payment terms..." />
                </div>
                <Button onClick={() => saveInvoice.mutate()} disabled={!form.amount || saveInvoice.isPending} className="w-full">
                  {editInvoiceId ? "Save Changes" : "Create Invoice"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: String(invoices.length), icon: FileText, color: "text-primary" },
          { label: "Paid", value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-green-500" },
          { label: "Pending", value: `₹${totalPending.toLocaleString()}`, icon: Clock, color: "text-amber-500" },
          { label: "Overdue", value: String(overdueCount), icon: XCircle, color: "text-red-500" },
        ].map(m => (
          <Card key={m.label} className="surface-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className={`size-4 ${m.color}`} />
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{m.label}</p>
            </div>
            <p className={`font-display text-2xl font-semibold ${m.color}`}>{m.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm"
            onClick={() => setFilterStatus(s)} className="capitalize h-8">
            {s === "all" ? "All" : STATUS_STYLES[s]?.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <Card className="surface-card p-10 text-center">
          <FileText className="size-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No invoices{filterStatus !== "all" ? ` with status "${filterStatus}"` : " yet"}</p>
          <p className="text-sm text-muted-foreground">Create your first invoice using the button above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv: any) => {
            const st = STATUS_STYLES[inv.status] ?? STATUS_STYLES.draft;
            const sym = CURRENCY_SYMBOL[inv.currency] ?? inv.currency;
            return (
              <Card key={inv.id} className="surface-card hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm tracking-wider">{inv.invoice_number}</span>
                          <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {inv.clients && <span className="flex items-center gap-1"><Building2 className="size-3" />{inv.clients.name}</span>}
                          {inv.projects && <span className="flex items-center gap-1"><FileText className="size-3" />{inv.projects.name}</span>}
                          {inv.due_date && <span className="flex items-center gap-1"><Calendar className="size-3" />Due: {new Date(inv.due_date).toLocaleDateString()}</span>}
                        </div>
                        {inv.notes && <p className="text-xs text-muted-foreground mt-1 italic">{inv.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto shrink-0">
                      <div className="text-right">
                        <p className="font-display font-bold text-lg">{sym}{Number(inv.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                      <Select value={inv.status} onValueChange={v => updateStatus.mutate({ id: inv.id, status: v })}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_STYLES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(inv)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(inv.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
