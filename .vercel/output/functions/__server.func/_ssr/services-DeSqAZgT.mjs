import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { supabase } from "./client-CzlCT6DG.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-DjVQhB97.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as Plus, b as Building2, h as CalendarClock } from "../_libs/lucide-react.mjs";
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
function ServicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    name: "",
    category: "",
    provider: "",
    login_email: "",
    monthly_cost: 0,
    yearly_cost: 0,
    renewal_date: "",
    url: "",
    notes: ""
  });
  const {
    data: services = []
  } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("services").select("*").order("renewal_date", {
        ascending: true,
        nullsFirst: false
      });
      if (error) throw error;
      return data;
    }
  });
  const create = useMutation({
    mutationFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        ...form,
        created_by: u.user.id,
        owner_id: u.user.id
      };
      if (!payload.renewal_date) delete payload.renewal_date;
      const {
        error
      } = await supabase.from("services").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service added");
      setOpen(false);
      qc.invalidateQueries({
        queryKey: ["services"]
      });
      setForm({
        name: "",
        category: "",
        provider: "",
        login_email: "",
        monthly_cost: 0,
        yearly_cost: 0,
        renewal_date: "",
        url: "",
        notes: ""
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const totalMonthly = services.reduce((s, x) => s + Number(x.monthly_cost || 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold", children: "Services & subscriptions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
          services.length,
          " services · $",
          totalMonthly.toLocaleString(),
          "/mo"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-1" }),
          "New service"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "New service" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Name *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
                  ...form,
                  name: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Category" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Hosting, SaaS…", value: form.category, onChange: (e) => setForm({
                  ...form,
                  category: e.target.value
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Provider" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.provider, onChange: (e) => setForm({
                  ...form,
                  provider: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Login email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: form.login_email, onChange: (e) => setForm({
                  ...form,
                  login_email: e.target.value
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Monthly cost" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.monthly_cost, onChange: (e) => setForm({
                  ...form,
                  monthly_cost: Number(e.target.value)
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Yearly cost" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.yearly_cost, onChange: (e) => setForm({
                  ...form,
                  yearly_cost: Number(e.target.value)
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Renewal date" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: form.renewal_date, onChange: (e) => setForm({
                  ...form,
                  renewal_date: e.target.value
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "URL" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.url, onChange: (e) => setForm({
                ...form,
                url: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Notes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.notes, onChange: (e) => setForm({
                ...form,
                notes: e.target.value
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => create.mutate(), disabled: !form.name || create.isPending, children: "Create" }) })
        ] })
      ] })
    ] }),
    services.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-10 mx-auto text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3", children: "No services tracked yet." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 xl:grid-cols-3 gap-4", children: services.map((s) => {
      const days = s.renewal_date ? Math.round((new Date(s.renewal_date).getTime() - Date.now()) / 864e5) : null;
      const expiring = days !== null && days <= 14;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-5 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold", children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              s.provider,
              s.category ? ` · ${s.category}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: s.status === "active" ? "default" : "secondary", className: "capitalize", children: s.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm space-y-1 text-muted-foreground", children: [
          s.login_email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: s.login_email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "$",
            Number(s.monthly_cost || 0).toFixed(2),
            "/mo · $",
            Number(s.yearly_cost || 0).toFixed(2),
            "/yr"
          ] }),
          s.renewal_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: expiring ? "text-warning flex items-center gap-1" : "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "size-3" }),
            "Renews ",
            new Date(s.renewal_date).toLocaleDateString(),
            days !== null && ` (${days}d)`
          ] })
        ] })
      ] }, s.id);
    }) })
  ] });
}
export {
  ServicesPage as component
};
