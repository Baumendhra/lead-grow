import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { m as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { supabase } from "./client-CzlCT6DG.mjs";
import { a as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-CFwyVRaN.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C0FSBq6T.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_u1EXWn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { e as Search, o as Star, p as Phone, G as Globe, q as Save, M as MapPin, D as Download } from "../_libs/lucide-react.mjs";
import { o as objectType, e as enumType, n as numberType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
function useServerFn(serverFn) {
  const router = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const searchSchema = objectType({
  query: stringType().min(1).max(200),
  location: stringType().max(200).optional(),
  minRating: numberType().min(0).max(5).optional(),
  minReviews: numberType().min(0).optional(),
  websiteFilter: enumType(["any", "has", "missing"]).optional()
});
const searchPlaces = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => searchSchema.parse(input)).handler(createSsrRpc("c11ad9419d76ec33bb1ef02ec5110dda480ee7d0949bf7e06f0a58bca4cd4d06"));
function scoreFor(r) {
  const reviews = r.user_ratings_total ?? 0;
  const rating = r.rating ?? 0;
  if (reviews >= 100 && rating >= 4.2 && !r.website) return "high";
  if (reviews >= 50 && rating >= 4) return "medium";
  return "low";
}
function LeadsPage() {
  const qc = useQueryClient();
  const search = useServerFn(searchPlaces);
  const [query, setQuery] = reactExports.useState("");
  const [location, setLocation] = reactExports.useState("");
  const [minRating, setMinRating] = reactExports.useState(0);
  const [minReviews, setMinReviews] = reactExports.useState(0);
  const [websiteFilter, setWebsiteFilter] = reactExports.useState("any");
  const [results, setResults] = reactExports.useState([]);
  const {
    data: savedLeads = []
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await supabase.from("leads").select("*").order("created_at", {
      ascending: false
    })).data ?? []
  });
  const run = useMutation({
    mutationFn: () => search({
      data: {
        query,
        location,
        minRating,
        minReviews,
        websiteFilter
      }
    }),
    onSuccess: (d) => {
      setResults(d.results);
      toast.success(`Found ${d.results.length} businesses`);
    },
    onError: (e) => toast.error(e.message)
  });
  const save = useMutation({
    mutationFn: async (r) => {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const {
        error
      } = await supabase.from("leads").insert({
        business_name: r.name,
        address: r.address,
        phone: r.phone,
        website: r.website,
        rating: r.rating,
        review_count: r.user_ratings_total,
        category: r.category,
        latitude: r.latitude,
        longitude: r.longitude,
        google_place_id: r.place_id,
        google_maps_url: r.google_maps_url,
        score: scoreFor(r),
        search_query: query,
        search_location: location,
        created_by: u.user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead saved");
      qc.invalidateQueries({
        queryKey: ["leads"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  function exportCSV() {
    if (savedLeads.length === 0) return toast.error("No saved leads to export");
    const rows = [["Name", "Phone", "Website", "Address", "Rating", "Reviews", "Score", "Status"]];
    savedLeads.forEach((l) => rows.push([l.business_name, l.phone || "", l.website || "", l.address || "", l.rating ?? "", l.review_count ?? "", l.score, l.status]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold", children: "Lead generation" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Search Google Maps, qualify, and save high-potential leads." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "search", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "search", children: "Search" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "saved", children: [
          "Saved (",
          savedLeads.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "search", className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-5 grid md:grid-cols-6 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2 grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Keyword / Industry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "e.g. dentists, restaurants", value: query, onChange: (e) => setQuery(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2 grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Location" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "e.g. Austin, TX", value: location, onChange: (e) => setLocation(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Min rating" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.1", min: 0, max: 5, value: minRating, onChange: (e) => setMinRating(Number(e.target.value)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Min reviews" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: minReviews, onChange: (e) => setMinReviews(Number(e.target.value)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Website" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: websiteFilter, onValueChange: (v) => setWebsiteFilter(v), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "any", children: "Any" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "has", children: "Has website" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "missing", children: "No website" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5 flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full md:w-auto", onClick: () => run.mutate(), disabled: !query || run.isPending, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 mr-1" }),
            run.isPending ? "Searching…" : "Search"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 xl:grid-cols-3 gap-3", children: [
          results.map((r) => {
            const score = scoreFor(r);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-4 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: r.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: r.address })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: score === "high" ? "default" : "secondary", className: "capitalize shrink-0", children: score })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
                r.rating != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3" }),
                  r.rating,
                  " (",
                  r.user_ratings_total ?? 0,
                  ")"
                ] }),
                r.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "size-3" }),
                  r.phone
                ] }),
                r.website && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: r.website, target: "_blank", rel: "noreferrer", className: "flex items-center gap-1 text-primary hover:underline", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "size-3" }),
                  "Website"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "w-full", onClick: () => save.mutate(r), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-3 mr-1" }),
                "Save lead"
              ] })
            ] }, r.place_id);
          }),
          results.length === 0 && !run.isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-10 text-center md:col-span-2 xl:col-span-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "size-10 mx-auto text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3", children: "Search to discover businesses on Google Maps." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "saved", className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: exportCSV, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4 mr-1" }),
          "Export CSV"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 xl:grid-cols-3 gap-3", children: [
          savedLeads.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card p-4 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: l.business_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: l.score === "high" ? "default" : "secondary", className: "capitalize", children: l.score })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: l.address }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
              l.rating != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "★ ",
                l.rating,
                " (",
                l.review_count ?? 0,
                ")"
              ] }),
              l.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: l.phone }),
              l.website && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "text-primary hover:underline", href: l.website, target: "_blank", rel: "noreferrer", children: l.website })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: l.status.replace("_", " ") })
          ] }, l.id)),
          savedLeads.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: "No saved leads yet." })
        ] })
      ] })
    ] })
  ] });
}
export {
  LeadsPage as component
};
