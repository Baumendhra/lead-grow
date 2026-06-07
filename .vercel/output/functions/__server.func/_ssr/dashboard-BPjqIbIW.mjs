import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { supabase } from "./client-CzlCT6DG.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { M as MapPin, U as Users, B as Briefcase, u as DollarSign, v as BellRing, w as TriangleAlert, A as Activity, T as TrendingUp } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, A as AreaChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, d as Area } from "../_libs/recharts.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
function Stat({
  icon: Icon,
  label,
  value,
  hint,
  trend
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "surface-card hover:bg-muted/10 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground font-medium", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-display text-3xl font-semibold tracking-tight", children: value }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-1 text-xs", children: [
        trend === "up" && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-3 text-green-500" }),
        trend === "down" && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-3 text-red-500 rotate-180" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: hint })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 rounded-xl bg-primary/10 grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-5 text-primary" }) })
  ] }) }) });
}
function Dashboard() {
  const {
    data
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [leads, clients, deals, services, activities, tasks] = await Promise.all([supabase.from("leads").select("id, status, score, created_at", {
        count: "exact"
      }), supabase.from("clients").select("id, status", {
        count: "exact"
      }), supabase.from("deals").select("id, value, stage, currency, created_at"), supabase.from("services").select("id, name, monthly_cost, renewal_date, status"), supabase.from("activities").select("id, type, content, created_at, entity_type").order("created_at", {
        ascending: false
      }).limit(6), supabase.from("tasks").select("id, title, status, deadline").in("status", ["todo", "in_progress"]).order("deadline", {
        ascending: true
      }).limit(5)]);
      return {
        leadsCount: leads.count ?? 0,
        leadsHigh: (leads.data ?? []).filter((l) => l.score === "high").length,
        clientsCount: (clients.data ?? []).filter((c) => c.status === "active").length,
        dealsOpen: (deals.data ?? []).filter((d) => !["won", "lost"].includes(d.stage)),
        dealsWon: (deals.data ?? []).filter((d) => d.stage === "won"),
        services: services.data ?? [],
        activities: activities.data ?? [],
        tasks: tasks.data ?? [],
        allDeals: deals.data ?? []
      };
    }
  });
  const monthlyRevenue = (data?.dealsWon ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
  const pipelineValue = (data?.dealsOpen ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
  (data?.services ?? []).reduce((s, x) => s + Number(x.monthly_cost || 0), 0);
  const upcomingRenewals = (data?.services ?? []).filter((s) => {
    if (!s.renewal_date) return false;
    const days = (new Date(s.renewal_date).getTime() - Date.now()) / 864e5;
    return days >= 0 && days <= 30;
  });
  const revenueChartData = (data?.allDeals ?? []).reduce((acc, deal) => {
    const month = new Date(deal.created_at).toLocaleString("default", {
      month: "short"
    });
    const existing = acc.find((x) => x.name === month);
    if (existing) {
      existing.value += deal.value || 0;
    } else {
      acc.push({
        name: month,
        value: deal.value || 0
      });
    }
    return acc;
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-end gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "Overview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Here's what's happening with your agency today." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: MapPin, label: "Total Leads", value: String(data?.leadsCount ?? 0), hint: `${data?.leadsHigh ?? 0} high potential`, trend: "up" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: Users, label: "Active Clients", value: String(data?.clientsCount ?? 0), hint: "Stable", trend: "neutral" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: Briefcase, label: "Pipeline", value: `$${pipelineValue.toLocaleString()}`, hint: `${data?.dealsOpen?.length ?? 0} active deals` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: DollarSign, label: "Revenue (Won)", value: `$${monthlyRevenue.toLocaleString()}`, hint: "Last 30 days", trend: "up" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2 surface-card border shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Revenue Trends" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Value of deals created over time" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-72", children: revenueChartData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: revenueChartData, margin: {
          top: 10,
          right: 30,
          left: 0,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorValue", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "hsl(var(--primary))", stopOpacity: 0.3 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "hsl(var(--primary))", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "hsl(var(--border))" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", stroke: "hsl(var(--muted-foreground))", fontSize: 12, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "hsl(var(--muted-foreground))", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => `$${v}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            backgroundColor: "hsl(var(--card))",
            borderRadius: "8px"
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "value", stroke: "hsl(var(--primary))", fillOpacity: 1, fill: "url(#colorValue)" })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full grid place-items-center text-muted-foreground text-sm", children: "Not enough deal data" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "size-4 text-amber-500" }),
            " Action Items"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            upcomingRenewals.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-lg text-sm flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-5 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Upcoming Renewals" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "opacity-90", children: [
                  upcomingRenewals.length,
                  " service(s) renewing in 30 days."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-muted-foreground tracking-wider", children: "Priority Tasks" }),
              data?.tasks?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No pending tasks." }),
              data?.tasks?.map((task) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: task.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "Due: ",
                    task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: task.status === "in_progress" ? "default" : "secondary", className: "text-[10px] shrink-0", children: task.status.replace("_", " ") })
              ] }, task.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "surface-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-4 text-blue-500" }),
            " Recent Activity"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            (data?.activities ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No recent activity." }),
            (data?.activities ?? []).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2 mt-1.5 rounded-full bg-primary/40 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: a.content || `${a.entity_type} updated` }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                  new Date(a.created_at).toLocaleDateString(),
                  " at ",
                  new Date(a.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                ] })
              ] })
            ] }, a.id))
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
