import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { supabase } from "./client-CzlCT6DG.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-DjVQhB97.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as Plus, K as KeyRound, E as EyeOff, f as Eye, g as Copy } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const KEY = "agencyos-v1";
function obf(s) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
  return out;
}
function deob(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] ^ KEY.charCodeAt(i % KEY.length));
  return s;
}
function toHex(bytes) {
  return "\\x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function VaultPage() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [reveal, setReveal] = reactExports.useState({});
  const [form, setForm] = reactExports.useState({
    label: "",
    kind: "password",
    username: "",
    secret: "",
    notes: ""
  });
  const {
    data: creds = [],
    error
  } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const {
        data,
        error: error2
      } = await supabase.from("credentials").select("*").order("created_at", {
        ascending: false
      });
      if (error2) throw error2;
      return data;
    },
    retry: false
  });
  const create = useMutation({
    mutationFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const enc = obf(form.secret);
      const {
        error: error2
      } = await supabase.from("credentials").insert({
        label: form.label,
        kind: form.kind,
        username: form.username,
        notes: form.notes,
        secret_encrypted: toHex(enc),
        created_by: u.user.id
      });
      if (error2) throw error2;
    },
    onSuccess: () => {
      toast.success("Credential saved");
      setOpen(false);
      qc.invalidateQueries({
        queryKey: ["credentials"]
      });
      setForm({
        label: "",
        kind: "password",
        username: "",
        secret: "",
        notes: ""
      });
    },
    onError: (e) => toast.error(e.message)
  });
  function decodeBytea(v) {
    if (!v) return "";
    if (typeof v === "string") {
      const hex = v.startsWith("\\x") ? v.slice(2) : v;
      const arr = new Uint8Array(hex.length / 2);
      for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
      return deob(arr);
    }
    return "";
  }
  function generate() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let s = "";
    const arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 20; i++) s += chars[arr[i] % chars.length];
    setForm((f) => ({
      ...f,
      secret: s
    }));
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold", children: "Credential vault" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Admin & owner access only." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-1" }),
          "New credential"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "New credential" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Label *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.label, onChange: (e) => setForm({
                  ...form,
                  label: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Kind" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.kind, onValueChange: (v) => setForm({
                  ...form,
                  kind: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "password", children: "Password" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "api_key", children: "API key" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ssh_key", children: "SSH key" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "token", children: "Token" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "recovery", children: "Recovery codes" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "note", children: "Secure note" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Username / email" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.username, onChange: (e) => setForm({
                ...form,
                username: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Secret *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: "ghost", onClick: generate, children: "Generate" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", value: form.secret, onChange: (e) => setForm({
                ...form,
                secret: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Notes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.notes, onChange: (e) => setForm({
                ...form,
                notes: e.target.value
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => create.mutate(), disabled: !form.label || !form.secret || create.isPending, children: "Save" }) })
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "surface-card p-6 text-sm", children: "You don't have permission to view the vault. Ask an owner or admin to grant you access." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 xl:grid-cols-3 gap-3", children: [
      creds.map((c) => {
        const visible = reveal[c.id];
        const secret = decodeBytea(c.secret_encrypted);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: c.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground capitalize", children: [
                c.kind.replace("_", " "),
                c.username ? ` · ${c.username}` : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "size-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { readOnly: true, type: visible ? "text" : "password", value: secret, className: "font-mono text-sm" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => setReveal((r) => ({
              ...r,
              [c.id]: !r[c.id]
            })), children: visible ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "size-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => {
              navigator.clipboard.writeText(secret);
              toast.success("Copied");
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }) })
          ] }),
          c.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: c.notes })
        ] }, c.id);
      }),
      !error && creds.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-10 text-center md:col-span-2 xl:col-span-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "size-10 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3", children: "No credentials stored yet." })
      ] })
    ] })
  ] });
}
export {
  VaultPage as component
};
