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
import { Plus, Building2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "", provider: "", login_email: "", monthly_cost: 0, yearly_cost: 0,
    renewal_date: "", url: "", notes: "",
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("renewal_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload: any = { ...form, created_by: u.user.id, owner_id: u.user.id };
      if (!payload.renewal_date) delete payload.renewal_date;
      const { error } = await supabase.from("services").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service added"); setOpen(false); qc.invalidateQueries({ queryKey: ["services"] }); setForm({ name: "", category: "", provider: "", login_email: "", monthly_cost: 0, yearly_cost: 0, renewal_date: "", url: "", notes: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalMonthly = services.reduce((s, x: any) => s + Number(x.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Services & subscriptions</h1>
          <p className="text-muted-foreground">{services.length} services · ${totalMonthly.toLocaleString()}/mo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" />New service</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New service</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Category</Label><Input placeholder="Hosting, SaaS…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Provider</Label><Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Login email</Label><Input type="email" value={form.login_email} onChange={e => setForm({ ...form, login_email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1"><Label>Monthly cost</Label><Input type="number" value={form.monthly_cost} onChange={e => setForm({ ...form, monthly_cost: Number(e.target.value) })} /></div>
                <div className="grid gap-1"><Label>Yearly cost</Label><Input type="number" value={form.yearly_cost} onChange={e => setForm({ ...form, yearly_cost: Number(e.target.value) })} /></div>
                <div className="grid gap-1"><Label>Renewal date</Label><Input type="date" value={form.renewal_date} onChange={e => setForm({ ...form, renewal_date: e.target.value })} /></div>
              </div>
              <div className="grid gap-1"><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
              <div className="grid gap-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="surface-card p-10 text-center"><Building2 className="size-10 mx-auto text-muted-foreground" /><p className="mt-3">No services tracked yet.</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((s: any) => {
            const days = s.renewal_date ? Math.round((new Date(s.renewal_date).getTime() - Date.now()) / 86400000) : null;
            const expiring = days !== null && days <= 14;
            return (
              <Card key={s.id} className="surface-card p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.provider}{s.category ? ` · ${s.category}` : ""}</p>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status}</Badge>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  {s.login_email && <p>{s.login_email}</p>}
                  <p>${Number(s.monthly_cost || 0).toFixed(2)}/mo · ${Number(s.yearly_cost || 0).toFixed(2)}/yr</p>
                  {s.renewal_date && (
                    <p className={expiring ? "text-warning flex items-center gap-1" : "flex items-center gap-1"}>
                      <CalendarClock className="size-3" />
                      Renews {new Date(s.renewal_date).toLocaleDateString()}{days !== null && ` (${days}d)`}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
