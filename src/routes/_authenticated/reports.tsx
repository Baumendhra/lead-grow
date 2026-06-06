import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-data"],
    queryFn: async () => {
      const [leads, clients, deals, services] = await Promise.all([
        supabase.from("leads").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("deals").select("*"),
        supabase.from("services").select("*"),
      ]);
      return {
        leads: leads.data ?? [],
        clients: clients.data ?? [],
        deals: deals.data ?? [],
        services: services.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading reports...</div>;
  }

  // Aggregate Data for Charts
  // 1. Deals by Stage
  const dealsByStage = Object.entries(
    data.deals.reduce((acc: any, deal: any) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  // 2. Leads by Score
  const leadsByScore = Object.entries(
    data.leads.reduce((acc: any, lead: any) => {
      acc[lead.score || 'unscored'] = (acc[lead.score || 'unscored'] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  // 3. Revenue pipeline (Top 5 deals by value)
  const topDeals = [...data.deals]
    .filter(d => d.stage !== 'lost')
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5)
    .map(d => ({ name: d.title.substring(0, 15) + "...", value: d.value }));

  // Export functions
  const exportCSV = (filename: string, dataset: any[]) => {
    if (dataset.length === 0) return toast.error("No data to export");
    const headers = Object.keys(dataset[0]);
    const rows = [headers];
    dataset.forEach((row) => {
      rows.push(headers.map(h => {
        let val = row[h];
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val ?? ''}"`;
      }));
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Gain insights into your agency's performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV('deals', data.deals)}>
            <Download className="size-4 mr-2" /> Deals CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV('leads', data.leads)}>
            <Download className="size-4 mr-2" /> Leads CSV
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /> Deals Pipeline Value</CardTitle>
            <CardDescription>Top 5 open/won deals by monetary value</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {topDeals.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDeals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">No deal data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-5 text-primary" /> Deals by Stage</CardTitle>
            <CardDescription>Distribution of deals across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {dealsByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dealsByStage} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dealsByStage.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">No deal data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-5 text-primary" /> Leads by Score</CardTitle>
            <CardDescription>Distribution of lead quality</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {leadsByScore.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadsByScore} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {leadsByScore.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-muted-foreground">No lead data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" /> Key Metrics Overview</CardTitle>
            <CardDescription>High-level statistics snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Total Revenue Won</span>
              <span className="font-semibold text-lg text-green-500">
                ${data.deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Active Services Monthly Cost</span>
              <span className="font-semibold text-lg">
                ${data.services.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthly_cost || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Client Conversion Rate</span>
              <span className="font-semibold text-lg">
                {data.leads.length ? Math.round((data.clients.length / data.leads.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Services Tracked</span>
              <span className="font-semibold text-lg">{data.services.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
