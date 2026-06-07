import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Building2, Trash2, ChevronDown, ChevronUp, Pencil,
  Layers, DollarSign, Receipt, Mail, Phone, Globe
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", company: "", industry: "", website: "", phone: "", email: "", notes: "",
  });

  // Clients with their projects + invoices counts
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // All projects (to show per-client)
  const { data: allProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("projects")
        .select("id, name, status, sold_price, client_id")
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  // All invoices (to show per-client)
  const { data: allInvoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("invoices")
        .select("id, invoice_number, amount, currency, status, client_id")
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const saveClient = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (editClientId) {
        const { error } = await supabase.from("clients").update({ ...form }).eq("id", editClientId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({ ...form, created_by: u.user.id, owner_id: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editClientId ? "Client updated" : "Client added");
      setOpen(false);
      setEditClientId(null);
      setForm({ name: "", company: "", industry: "", website: "", phone: "", email: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(c: any) {
    setForm({
      name: c.name || "", company: c.company || "", industry: c.industry || "",
      website: c.website || "", phone: c.phone || "", email: c.email || "", notes: c.notes || ""
    });
    setEditClientId(c.id);
    setOpen(true);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setEditClientId(null);
      setForm({ name: "", company: "", industry: "", website: "", phone: "", email: "", notes: "" });
    }
  }

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client deleted");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const CURRENCY_SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
    active:    { label: "Active",    badge: "default" },
    completed: { label: "Completed", badge: "secondary" },
    on_hold:   { label: "On Hold",   badge: "outline" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">CRM — Clients</h1>
          <p className="text-muted-foreground">{clients.length} client{clients.length === 1 ? "" : "s"}</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditClientId(null); setForm({ name: "", company: "", industry: "", website: "", phone: "", email: "", notes: "" }); }}>
              <Plus className="size-4 mr-1" />New client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editClientId ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Company</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid gap-1"><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
              <div className="grid gap-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveClient.mutate()} disabled={!form.name || saveClient.isPending}>
                {editClientId ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete client?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will also unlink their projects and invoices. This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteClient.mutate(deleteId!)} disabled={deleteClient.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {clients.length === 0 ? (
        <Card className="surface-card p-10 text-center">
          <Building2 className="size-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No clients yet</p>
          <p className="text-sm text-muted-foreground">Add your first client above.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c: any) => {
            const clientProjects = allProjects.filter((p: any) => p.client_id === c.id);
            const clientInvoices = allInvoices.filter((i: any) => i.client_id === c.id);
            const totalRevenue = clientProjects.reduce((s: number, p: any) => s + Number(p.sold_price || 0), 0);
            const isExpanded = expandedId === c.id;

            return (
              <Card key={c.id} className="surface-card overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-display font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.company || "—"}{c.industry ? ` · ${c.industry}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">{c.status}</Badge>
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(c)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {c.email && <p className="flex items-center gap-1.5"><Mail className="size-3" />{c.email}</p>}
                    {c.phone && <p className="flex items-center gap-1.5"><Phone className="size-3" />{c.phone}</p>}
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline">
                        <Globe className="size-3" />{c.website}
                      </a>
                    )}
                  </div>

                  {/* Stats bar */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs">
                      <Layers className="size-3 text-blue-500" />
                      <span className="font-medium">{clientProjects.length}</span>
                      <span className="text-muted-foreground">project{clientProjects.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Receipt className="size-3 text-purple-500" />
                      <span className="font-medium">{clientInvoices.length}</span>
                      <span className="text-muted-foreground">invoice{clientInvoices.length !== 1 ? "s" : ""}</span>
                    </div>
                    {totalRevenue > 0 && (
                      <div className="flex items-center gap-1 text-xs ml-auto">
                        <DollarSign className="size-3 text-green-500" />
                        <span className="font-medium text-green-600 dark:text-green-400">₹{totalRevenue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Expand toggle */}
                  {(clientProjects.length > 0 || clientInvoices.length > 0) && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs text-muted-foreground"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      {isExpanded ? <><ChevronUp className="size-3 mr-1" />Hide details</> : <><ChevronDown className="size-3 mr-1" />Show projects & invoices</>}
                    </Button>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                    {clientProjects.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Projects</p>
                        <div className="space-y-1.5">
                          {clientProjects.map((p: any) => {
                            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.active;
                            return (
                              <div key={p.id} className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5 text-xs">
                                <span className="font-medium truncate mr-2">{p.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {Number(p.sold_price) > 0 && (
                                    <span className="text-green-600 dark:text-green-400 font-medium">₹{Number(p.sold_price).toLocaleString()}</span>
                                  )}
                                  <Badge variant={cfg.badge} className="text-[10px] capitalize">{cfg.label}</Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {clientInvoices.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Invoices</p>
                        <div className="space-y-1.5">
                          {clientInvoices.map((inv: any) => {
                            const sym = CURRENCY_SYM[inv.currency] ?? inv.currency;
                            const statusColor = inv.status === "paid" ? "text-green-500" : inv.status === "overdue" ? "text-red-500" : "text-muted-foreground";
                            return (
                              <div key={inv.id} className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5 text-xs">
                                <span className="font-mono font-medium">{inv.invoice_number}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{sym}{Number(inv.amount).toLocaleString()}</span>
                                  <span className={`capitalize font-medium ${statusColor}`}>{inv.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
