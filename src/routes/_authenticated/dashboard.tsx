import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, MapPin, Briefcase, DollarSign, Calendar, TrendingUp, KeyRound, Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <Card className="surface-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="size-10 rounded-md bg-accent grid place-items-center">
            <Icon className="size-5 text-accent-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [leads, clients, deals, services, activities] = await Promise.all([
        supabase.from("leads").select("id, status, score", { count: "exact" }),
        supabase.from("clients").select("id, status", { count: "exact" }),
        supabase.from("deals").select("id, value, stage, currency"),
        supabase.from("services").select("id, monthly_cost, renewal_date, status"),
        supabase.from("activities").select("id, type, content, created_at, entity_type").order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        leadsCount: leads.count ?? 0,
        leadsHigh: (leads.data ?? []).filter(l => l.score === "high").length,
        clientsCount: (clients.data ?? []).filter(c => c.status === "active").length,
        dealsOpen: (deals.data ?? []).filter(d => !["won", "lost"].includes(d.stage)),
        dealsWon: (deals.data ?? []).filter(d => d.stage === "won"),
        services: services.data ?? [],
        activities: activities.data ?? [],
      };
    },
  });

  const monthlyRevenue = (data?.dealsWon ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
  const pipelineValue = (data?.dealsOpen ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
  const monthlyCost = (data?.services ?? []).reduce((s, x: any) => s + Number(x.monthly_cost || 0), 0);
  const upcomingRenewals = (data?.services ?? []).filter((s: any) => {
    if (!s.renewal_date) return false;
    const days = (new Date(s.renewal_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Real-time snapshot of your agency.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={MapPin} label="Total leads" value={String(data?.leadsCount ?? 0)} hint={`${data?.leadsHigh ?? 0} high potential`} />
        <Stat icon={Users} label="Active clients" value={String(data?.clientsCount ?? 0)} />
        <Stat icon={Briefcase} label="Open deals" value={String(data?.dealsOpen?.length ?? 0)} hint={`Pipeline $${pipelineValue.toLocaleString()}`} />
        <Stat icon={DollarSign} label="Won revenue" value={`$${monthlyRevenue.toLocaleString()}`} />
        <Stat icon={Calendar} label="Renewals (30d)" value={String(upcomingRenewals)} />
        <Stat icon={KeyRound} label="Services" value={String(data?.services.length ?? 0)} hint={`$${monthlyCost.toFixed(0)}/mo`} />
        <Stat icon={TrendingUp} label="Conversion" value={`${data?.leadsCount ? Math.round((data.clientsCount / data.leadsCount) * 100) : 0}%`} hint="Leads → clients" />
        <Stat icon={Activity} label="Activities" value={String(data?.activities?.length ?? 0)} hint="recent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 surface-card">
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.activities ?? []).length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {(data?.activities ?? []).map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                <div className="flex-1">
                  <p className="text-foreground">{a.content || `${a.entity_type} updated`}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader><CardTitle>Upcoming renewals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.services ?? [])
              .filter((s: any) => s.renewal_date)
              .sort((a: any, b: any) => +new Date(a.renewal_date) - +new Date(b.renewal_date))
              .slice(0, 6)
              .map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{(s as any).name ?? "—"}</span>
                  <span className="text-muted-foreground">{new Date(s.renewal_date).toLocaleDateString()}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
