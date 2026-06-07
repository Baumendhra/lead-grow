import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, Calendar, TrendingUp, Activity,
  BellRing, CheckSquare, Layers
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint, trend, color = "text-primary" }: {
  icon: any; label: string; value: string; hint?: string; trend?: "up" | "down" | "neutral"; color?: string;
}) {
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
            <Icon className={`size-5 ${color}`} />
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
      const [projectsRes, tasksRes, clientsRes, activitiesRes] = await Promise.all([
        supabase.from("projects").select("id, name, status, sold_price, created_at, client_id") as any,
        supabase.from("tasks").select("id, title, status, deadline, priority").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, status"),
        supabase.from("activities").select("id, type, content, created_at, entity_type").order("created_at", { ascending: false }).limit(6),
      ]);

      const projects: any[] = (projectsRes as any).data ?? [];
      const tasks = tasksRes.data ?? [];
      const clients = clientsRes.data ?? [];

      // Revenue chart: group sold_price by month
      const revenueByMonth = projects.reduce((acc: Record<string, number>, p) => {
        const month = new Date(p.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
        acc[month] = (acc[month] || 0) + Number(p.sold_price || 0);
        return acc;
      }, {});
      const revenueChartData = Object.entries(revenueByMonth).map(([name, value]) => ({ name, value }));

      const pendingTasks = tasks.filter(t => t.status !== "done");
      const upcomingDeadlines = pendingTasks
        .filter(t => t.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5);

      return {
        projects,
        tasks,
        clients,
        activities: activitiesRes.data ?? [],
        revenueChartData,
        pendingTasks,
        upcomingDeadlines,
        totalRevenue: projects.reduce((s, p) => s + Number(p.sold_price || 0), 0),
        activeClients: clients.filter(c => c.status === "active").length,
        activeProjects: projects.filter(p => p.status === "active").length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your agency today.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Total Projects" value={String(data?.projects?.length ?? 0)}
          hint={`${data?.activeProjects ?? 0} active`} trend="up" />
        <Stat icon={Users} label="Active Clients" value={String(data?.activeClients ?? 0)}
          hint="In CRM" trend="neutral" />
        <Stat icon={DollarSign} label="Total Revenue" value={`₹${(data?.totalRevenue ?? 0).toLocaleString()}`}
          hint="Sum of sold prices" trend="up" color="text-green-500" />
        <Stat icon={CheckSquare} label="Pending Tasks" value={String(data?.pendingTasks?.length ?? 0)}
          hint={`${(data?.tasks ?? []).filter(t => t.status === "in_progress").length} in progress`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 surface-card border shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Sold price of projects by month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {(data?.revenueChartData ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data!.revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground text-sm">
                No project data yet — add projects with a sold price to see trends
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Action Items: Upcoming Task Deadlines */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4 text-amber-500" /> Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.upcomingDeadlines ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming task deadlines.</p>
              )}
              {(data?.upcomingDeadlines ?? []).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={task.priority === "high" ? "destructive" : task.status === "in_progress" ? "default" : "secondary"}
                    className="text-[10px] shrink-0 capitalize"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
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
                        {new Date(a.created_at).toLocaleDateString()} at{" "}
                        {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
