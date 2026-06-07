import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, BarChart3, PieChart as PieChartIcon, CheckSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-data"],
    queryFn: async () => {
      const [projectsRes, tasksRes, clientsRes] = await Promise.all([
        supabase.from("projects").select("id, name, status, sold_price, created_at, client_id, clients(name)"),
        supabase.from("tasks").select("id, status, priority, project_id"),
        supabase.from("clients").select("id, name, status"),
      ]);
      return {
        projects: (projectsRes.data ?? []) as any[],
        tasks: tasksRes.data ?? [],
        clients: clientsRes.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading reports...</div>;
  }

  // 1. Revenue by Client (bar)
  const revenueByClient = Object.entries(
    data.projects.reduce((acc: Record<string, number>, p: any) => {
      const clientName = p.clients?.name || "Unassigned";
      acc[clientName] = (acc[clientName] || 0) + Number(p.sold_price || 0);
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 2. Projects by Status (pie)
  const projectsByStatus = Object.entries(
    data.projects.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status || "active"] = (acc[p.status || "active"] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace("_", " ").toUpperCase(), value }));

  // 3. Top 5 projects by sold_price (bar)
  const topProjects = [...data.projects]
    .filter(p => Number(p.sold_price || 0) > 0)
    .sort((a: any, b: any) => Number(b.sold_price || 0) - Number(a.sold_price || 0))
    .slice(0, 5)
    .map((p: any) => ({
      name: p.name.length > 14 ? p.name.substring(0, 14) + "…" : p.name,
      value: Number(p.sold_price || 0),
    }));

  // 4. Task completion (pie)
  const tasksByStatus = Object.entries(
    data.tasks.reduce((acc: Record<string, number>, t: any) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace("_", " ").toUpperCase(), value }));

  // Key metrics
  const totalRevenue = data.projects.reduce((s: number, p: any) => s + Number(p.sold_price || 0), 0);
  const completedProjects = data.projects.filter((p: any) => p.status === "completed").length;
  const avgValue = data.projects.length > 0 ? totalRevenue / data.projects.length : 0;
  const activeTasks = data.tasks.filter((t: any) => t.status !== "done").length;

  const exportCSV = (filename: string, dataset: any[]) => {
    if (dataset.length === 0) return toast.error("No data to export");
    const headers = Object.keys(dataset[0]);
    const rows = [headers];
    dataset.forEach((row) => {
      rows.push(
        headers.map((h) => {
          let val = row[h];
          if (typeof val === "object" && val !== null) val = JSON.stringify(val);
          if (typeof val === "string") val = val.replace(/"/g, '""');
          return `"${val ?? ""}"`;
        })
      );
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Insights into project revenue and team performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV("projects", data.projects)}>
            <Download className="size-4 mr-2" /> Projects CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV("tasks", data.tasks)}>
            <Download className="size-4 mr-2" /> Tasks CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "text-green-500" },
          { label: "Completed Projects", value: String(completedProjects), color: "text-blue-500" },
          { label: "Avg Project Value", value: `₹${Math.round(avgValue).toLocaleString()}`, color: "text-purple-500" },
          { label: "Active Tasks", value: String(activeTasks), color: "text-amber-500" },
        ].map((m) => (
          <Card key={m.label} className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{m.label}</p>
            <p className={`mt-1 font-display text-2xl font-semibold ${m.color}`}>{m.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> Revenue by Client
            </CardTitle>
            <CardDescription>Total sold price of projects per client</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {revenueByClient.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByClient} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                    angle={-30} textAnchor="end" interval={0} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${v}`} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">
                No project revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Projects by Value */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" /> Top Projects by Sold Price
            </CardTitle>
            <CardDescription>Highest value projects in your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {topProjects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjects} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Sold Price"]} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">
                Add sold prices to projects to see rankings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="size-5 text-primary" /> Projects by Status
            </CardTitle>
            <CardDescription>Distribution across active / completed / on hold</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {projectsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value">
                    {projectsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">No project data</div>
            )}
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-5 text-primary" /> Task Completion Breakdown
            </CardTitle>
            <CardDescription>Tasks by current status across all projects</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {tasksByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value">
                    {tasksByStatus.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">No task data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
