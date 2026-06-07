import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Plus, Eye, EyeOff, Copy, Layers, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vault")({
  component: VaultPage,
});

const KEY = "agencyos-v1";
function obf(s: string) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
  return out;
}
function deob(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] ^ KEY.charCodeAt(i % KEY.length));
  return s;
}
function toHex(bytes: Uint8Array) {
  return "\\x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
function decodeBytea(v: any): string {
  if (!v) return "";
  if (typeof v === "string") {
    const hex = v.startsWith("\\x") ? v.slice(2) : v;
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    return deob(arr);
  }
  return "";
}

function CredCard({ c, onReveal, revealed }: { c: any; onReveal: () => void; revealed: boolean }) {
  const secret = decodeBytea(c.secret_encrypted);
  return (
    <Card className="surface-card p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm">{c.label}</p>
          <p className="text-xs text-muted-foreground capitalize">{c.kind.replace("_", " ")}{c.username ? ` · ${c.username}` : ""}</p>
        </div>
        <KeyRound className="size-4 text-muted-foreground shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Input readOnly type={revealed ? "text" : "password"} value={secret} className="font-mono text-sm" />
        <Button size="icon" variant="ghost" onClick={onReveal}>
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(secret); toast.success("Copied"); }}>
          <Copy className="size-4" />
        </Button>
      </div>
      {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
    </Card>
  );
}

function VaultPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<"general" | "project">("general");
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [form, setForm] = useState({
    label: "", kind: "password", username: "", secret: "", notes: "",
    project_id: "none",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("projects").select("id, name").order("name");
      return (data ?? []) as any[];
    },
  });

  const { data: creds = [], error } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    retry: false,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const enc = obf(form.secret);
      const { error } = await (supabase as any).from("credentials").insert({
        label: form.label, kind: form.kind, username: form.username,
        notes: form.notes, secret_encrypted: toHex(enc),
        project_id: form.project_id === "none" ? null : form.project_id,
        created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credential saved");
      setOpen(false);
      setForm({ label: "", kind: "password", username: "", secret: "", notes: "", project_id: "none" });
      qc.invalidateQueries({ queryKey: ["credentials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function generate() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let s = ""; const arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 20; i++) s += chars[arr[i] % chars.length];
    setForm(f => ({ ...f, secret: s }));
  }

  const generalCreds = creds.filter((c: any) => !c.project_id);
  const projectCreds = creds.filter((c: any) => !!c.project_id);
  const filteredProjectCreds = filterProjectId === "all"
    ? projectCreds
    : projectCreds.filter((c: any) => c.project_id === filterProjectId);

  // Group project creds by project
  const credsByProject = projects.reduce((acc: Record<string, any[]>, p: any) => {
    const pCreds = projectCreds.filter((c: any) => c.project_id === p.id);
    if (pCreds.length > 0 || filterProjectId === p.id) acc[p.id] = pCreds;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Credential Vault</h1>
          <p className="text-muted-foreground">Admin & owner access only · {creds.length} stored</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" />New credential</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New credential</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Label *</Label>
                  <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="grid gap-1"><Label>Kind</Label>
                  <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="api_key">API key</SelectItem>
                      <SelectItem value="ssh_key">SSH key</SelectItem>
                      <SelectItem value="token">Token</SelectItem>
                      <SelectItem value="recovery">Recovery codes</SelectItem>
                      <SelectItem value="note">Secure note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1"><Label>Username / email</Label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <Label>Secret *</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={generate}>Generate</Button>
                </div>
                <Input type="text" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} />
              </div>
              <div className="grid gap-1"><Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label>Link to Project <span className="text-muted-foreground text-xs">(optional — leave blank for General)</span></Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="General (no project)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— General —</SelectItem>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.label || !form.secret || create.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="surface-card p-6 text-sm text-destructive">
          You don't have permission to view the vault. Ask an owner or admin to grant you access.
        </Card>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b pb-4">
        <Button variant={activeSection === "general" ? "default" : "outline"} size="sm"
          onClick={() => setActiveSection("general")} className="gap-2">
          <Globe className="size-4" /> General
          {generalCreds.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{generalCreds.length}</Badge>}
        </Button>
        <Button variant={activeSection === "project" ? "default" : "outline"} size="sm"
          onClick={() => setActiveSection("project")} className="gap-2">
          <Layers className="size-4" /> Projects
          {projectCreds.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{projectCreds.length}</Badge>}
        </Button>
      </div>

      {/* General Section */}
      {activeSection === "general" && (
        <div>
          {generalCreds.length === 0 && !error ? (
            <Card className="surface-card p-10 text-center">
              <Globe className="size-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No general credentials</p>
              <p className="text-sm text-muted-foreground">Add credentials not tied to any project.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {generalCreds.map((c: any) => (
                <CredCard key={c.id} c={c} revealed={!!reveal[c.id]}
                  onReveal={() => setReveal(r => ({ ...r, [c.id]: !r[c.id] }))} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Section */}
      {activeSection === "project" && (
        <div className="space-y-6">
          {/* Project Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant={filterProjectId === "all" ? "default" : "outline"} size="sm"
              onClick={() => setFilterProjectId("all")}>All Projects</Button>
            {projects.map((p: any) => (
              <Button key={p.id} variant={filterProjectId === p.id ? "default" : "outline"} size="sm"
                onClick={() => setFilterProjectId(p.id)}>{p.name}</Button>
            ))}
          </div>

          {filterProjectId === "all" ? (
            // Show grouped by project
            Object.keys(credsByProject).length === 0 && !error ? (
              <Card className="surface-card p-10 text-center">
                <Layers className="size-10 mx-auto text-muted-foreground" />
                <p className="mt-3 font-medium">No project credentials</p>
                <p className="text-sm text-muted-foreground">Add a credential and link it to a project.</p>
              </Card>
            ) : (
              Object.entries(credsByProject).map(([pid, pCreds]) => {
                const proj = projects.find((p: any) => p.id === pid);
                return (
                  <div key={pid}>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="size-4 text-primary" />
                      <h3 className="font-semibold">{proj?.name ?? "Unknown Project"}</h3>
                      <Badge variant="secondary" className="text-xs">{(pCreds as any[]).length}</Badge>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {(pCreds as any[]).map((c: any) => (
                        <CredCard key={c.id} c={c} revealed={!!reveal[c.id]}
                          onReveal={() => setReveal(r => ({ ...r, [c.id]: !r[c.id] }))} />
                      ))}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Filtered to one project
            <div>
              {filteredProjectCreds.length === 0 ? (
                <Card className="surface-card p-10 text-center">
                  <Layers className="size-10 mx-auto text-muted-foreground" />
                  <p className="mt-3 font-medium">No credentials for this project yet</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProjectCreds.map((c: any) => (
                    <CredCard key={c.id} c={c} revealed={!!reveal[c.id]}
                      onReveal={() => setReveal(r => ({ ...r, [c.id]: !r[c.id] }))} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
