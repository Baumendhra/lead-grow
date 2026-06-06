import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

export const Route = createFileRoute("/_authenticated/deals")({
  component: DealsPage,
});

function DealsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value: 0, stage: "new", client_id: "" });

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, clients(name, company)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await supabase.from("clients").select("id, name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("deals").insert({
        title: form.title, value: form.value, stage: form.stage,
        client_id: form.client_id || null, created_by: u.user.id, owner_id: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deal added"); setOpen(false); setForm({ title: "", value: 0, stage: "new", client_id: "" }); qc.invalidateQueries({ queryKey: ["deals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Deals pipeline</h1>
          <p className="text-muted-foreground">Drag stages by selecting a new stage.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" />New deal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Value (USD)</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} /></div>
                <div className="grid gap-1"><Label>Stage</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1"><Label>Client</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map(stage => {
          const list = deals.filter(d => d.stage === stage);
          const sum = list.reduce((s, d) => s + Number(d.value || 0), 0);
          return (
            <div key={stage} className="rounded-lg border bg-card/40 p-3 min-h-[280px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide font-medium capitalize">{stage}</p>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">${sum.toLocaleString()}</p>
              <div className="space-y-2">
                {list.map(d => (
                  <Card key={d.id} className="p-3 surface-card">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.clients?.name || "No client"}</p>
                    <p className="text-sm mt-1">${Number(d.value).toLocaleString()}</p>
                    <Select value={d.stage} onValueChange={(v) => move.mutate({ id: d.id, stage: v })}>
                      <SelectTrigger className="h-7 mt-2 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Card>
                ))}
                {list.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center"><Briefcase className="size-4 mx-auto opacity-30" /></p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
