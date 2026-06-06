import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Plus, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vault")({
  component: VaultPage,
});

// Lightweight client-side obfuscation (XOR) so secret_encrypted is never plaintext.
// Note: real encryption-at-rest with a workspace key is a follow-up; v1 stores
// admin-only opaque blobs under RLS that already locks reads to admins/owners.
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

function VaultPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ label: "", kind: "password", username: "", secret: "", notes: "" });

  const { data: creds = [], error } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credentials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: false,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const enc = obf(form.secret);
      const { error } = await supabase.from("credentials").insert({
        label: form.label, kind: form.kind, username: form.username,
        notes: form.notes, secret_encrypted: toHex(enc) as any, created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Credential saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["credentials"] }); setForm({ label: "", kind: "password", username: "", secret: "", notes: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function decodeBytea(v: any): string {
    if (!v) return "";
    if (typeof v === "string") {
      // Supabase returns bytea as "\\xHEX" string
      const hex = v.startsWith("\\x") ? v.slice(2) : v;
      const arr = new Uint8Array(hex.length / 2);
      for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
      return deob(arr);
    }
    return "";
  }

  function generate() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let s = ""; const arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 20; i++) s += chars[arr[i] % chars.length];
    setForm(f => ({ ...f, secret: s }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Credential vault</h1>
          <p className="text-muted-foreground">Admin & owner access only.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" />New credential</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New credential</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label>Label *</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Kind</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
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
              <div className="grid gap-1"><Label>Username / email</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
              <div className="grid gap-1">
                <div className="flex items-center justify-between"><Label>Secret *</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={generate}>Generate</Button>
                </div>
                <Input type="text" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} />
              </div>
              <div className="grid gap-1"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.label || !form.secret || create.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="surface-card p-6 text-sm">
          You don't have permission to view the vault. Ask an owner or admin to grant you access.
        </Card>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {creds.map((c: any) => {
          const visible = reveal[c.id];
          const secret = decodeBytea(c.secret_encrypted);
          return (
            <Card key={c.id} className="surface-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.kind.replace("_", " ")}{c.username ? ` · ${c.username}` : ""}</p>
                </div>
                <KeyRound className="size-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly type={visible ? "text" : "password"} value={secret} className="font-mono text-sm" />
                <Button size="icon" variant="ghost" onClick={() => setReveal(r => ({ ...r, [c.id]: !r[c.id] }))}>
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(secret); toast.success("Copied"); }}>
                  <Copy className="size-4" />
                </Button>
              </div>
              {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
            </Card>
          );
        })}
        {!error && creds.length === 0 && (
          <Card className="surface-card p-10 text-center md:col-span-2 xl:col-span-3">
            <KeyRound className="size-10 mx-auto text-muted-foreground" />
            <p className="mt-3">No credentials stored yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
