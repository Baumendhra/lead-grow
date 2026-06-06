import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, MapPin, Briefcase, DollarSign, Calendar, TrendingUp, KeyRound, Activity,
  BellRing, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint, trend }: { icon: any; label: string; value: string; hint?: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card className="surface-card hover:bg-muted/10 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
            {hint && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                {trend === "up" && <TrendingUp className="size-3 text-green-500" />}
                {trend === "down" && <TrendingUp className="size-3 text-red-500 rotate-180" />}
                <p className="text-muted-foreground">{hint}</p>
              </div>
            )}
          </div>
          <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
            <Icon className="size-5 text-primary" />
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
      const [leads, clients, deals, services, activities, tasks] = await Promise.all([
        supabase.from("leads").select("id, status, score, created_at", { count: "exact" }),
        supabase.from("clients").select("id, status", { count: "exact" }),
        supabase.from("deals").select("id, value, stage, currency, created_at"),
        supabase.from("services").select("id, name, monthly_cost, renewal_date, status"),
        supabase.from("activities").select("id, type, content, created_at, entity_type").order("created_at", { ascending: false }).limit(6),
        supabase.from("tasks").select("id, title, status, deadline").in('status', ['todo', 'in_progress']).order("deadline", { ascending: true }).limit(5),
      ]);
      return {
        leadsCount: leads.count ?? 0,
        leadsHigh: (leads.data ?? []).filter(l => l.score === "high").length,
        clientsCount: (clients.data ?? []).filter(c => c.status === "active").length,
        dealsOpen: (deals.data ?? []).filter(d => !["won", "lost"].includes(d.stage)),
        dealsWon: (deals.data ?? []).filter(d => d.stage === "won"),
        services: services.data ?? [],
        activities: activities.data ?? [],
        tasks: tasks.data ?? [],
        allDeals: deals.data ?? [],
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
  });

  // Generate fake revenue timeline data based on deals won
  const revenueChartData = (data?.allDeals ?? []).reduce((acc: any[], deal) => {
    const month = new Date(deal.created_at).toLocaleString('default', { month: 'short' });
    const existing = acc.find(x => x.name === month);
    if (existing) {
      existing.value += deal.value || 0;
    } else {
      acc.push({ name: month, value: deal.value || 0 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your agency today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={MapPin} label="Total Leads" value={String(data?.leadsCount ?? 0)} hint={`${data?.leadsHigh ?? 0} high potential`} trend="up" />
        <Stat icon={Users} label="Active Clients" value={String(data?.clientsCount ?? 0)} hint="Stable" trend="neutral" />
        <Stat icon={Briefcase} label="Pipeline" value={`$${pipelineValue.toLocaleString()}`} hint={`${data?.dealsOpen?.length ?? 0} active deals`} />
        <Stat icon={DollarSign} label="Revenue (Won)" value={`$${monthlyRevenue.toLocaleString()}`} hint="Last 30 days" trend="up" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 surface-card border shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Value of deals created over time</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground text-sm">Not enough deal data</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4 text-amber-500" /> Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingRenewals.length > 0 && (
                <div className="p-3 bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-lg text-sm flex items-start gap-3">
                  <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Upcoming Renewals</p>
                    <p className="opacity-90">{upcomingRenewals.length} service(s) renewing in 30 days.</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Priority Tasks</p>
                {data?.tasks?.length === 0 && <p className="text-sm text-muted-foreground">No pending tasks.</p>}
                {data?.tasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</p>
                    </div>
                    <Badge variant={task.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-blue-500" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.activities ?? []).length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                {(data?.activities ?? []).map((a: any) => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <div className="size-2 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                    <div>
                      <p className="text-foreground">{a.content || `${a.entity_type} updated`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.created_at).toLocaleDateString()} at {new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
