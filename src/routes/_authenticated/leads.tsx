import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { searchPlaces, type LeadResult } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Search, Star, Phone, Globe, Save, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

function scoreFor(r: LeadResult): "high" | "medium" | "low" {
  const reviews = r.user_ratings_total ?? 0;
  const rating = r.rating ?? 0;
  if (reviews >= 100 && rating >= 4.2 && !r.website) return "high";
  if (reviews >= 50 && rating >= 4) return "medium";
  return "low";
}

function LeadsPage() {
  const qc = useQueryClient();
  const search = useServerFn(searchPlaces);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [websiteFilter, setWebsiteFilter] = useState<"any" | "has" | "missing">("any");
  const [results, setResults] = useState<LeadResult[]>([]);

  const { data: savedLeads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await supabase.from("leads").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const run = useMutation({
    mutationFn: () => search({ data: { query, location, minRating, minReviews, websiteFilter } }),
    onSuccess: (d) => { setResults(d.results); toast.success(`Found ${d.results.length} businesses`); },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (r: LeadResult) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("leads").insert({
        business_name: r.name, address: r.address, phone: r.phone, website: r.website,
        rating: r.rating, review_count: r.user_ratings_total, category: r.category,
        latitude: r.latitude, longitude: r.longitude, google_place_id: r.place_id,
        google_maps_url: r.google_maps_url, score: scoreFor(r),
        search_query: query, search_location: location, created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead saved"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function exportCSV() {
    if (savedLeads.length === 0) return toast.error("No saved leads to export");
    const rows = [["Name", "Phone", "Website", "Address", "Rating", "Reviews", "Score", "Status"]];
    savedLeads.forEach((l: any) => rows.push([l.business_name, l.phone || "", l.website || "", l.address || "", l.rating ?? "", l.review_count ?? "", l.score, l.status]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Lead generation</h1>
        <p className="text-muted-foreground">Search Google Maps, qualify, and save high-potential leads.</p>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedLeads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 mt-4">
          <Card className="surface-card p-5 grid md:grid-cols-6 gap-3">
            <div className="md:col-span-2 grid gap-1"><Label>Keyword / Industry</Label>
              <Input placeholder="e.g. dentists, restaurants" value={query} onChange={e => setQuery(e.target.value)} /></div>
            <div className="md:col-span-2 grid gap-1"><Label>Location</Label>
              <Input placeholder="e.g. Austin, TX" value={location} onChange={e => setLocation(e.target.value)} /></div>
            <div className="grid gap-1"><Label>Min rating</Label>
              <Input type="number" step="0.1" min={0} max={5} value={minRating} onChange={e => setMinRating(Number(e.target.value))} /></div>
            <div className="grid gap-1"><Label>Min reviews</Label>
              <Input type="number" min={0} value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} /></div>
            <div className="grid gap-1"><Label>Website</Label>
              <Select value={websiteFilter} onValueChange={(v: any) => setWebsiteFilter(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="has">Has website</SelectItem>
                  <SelectItem value="missing">No website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5 flex items-end">
              <Button className="w-full md:w-auto" onClick={() => run.mutate()} disabled={!query || run.isPending}>
                <Search className="size-4 mr-1" />{run.isPending ? "Searching…" : "Search"}
              </Button>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {results.map(r => {
              const score = scoreFor(r);
              return (
                <Card key={r.place_id} className="surface-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.address}</p>
                    </div>
                    <Badge variant={score === "high" ? "default" : "secondary"} className="capitalize shrink-0">{score}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {r.rating != null && <span className="flex items-center gap-1"><Star className="size-3" />{r.rating} ({r.user_ratings_total ?? 0})</span>}
                    {r.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{r.phone}</span>}
                    {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="size-3" />Website</a>}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => save.mutate(r)}>
                    <Save className="size-3 mr-1" />Save lead
                  </Button>
                </Card>
              );
            })}
            {results.length === 0 && !run.isPending && (
              <Card className="surface-card p-10 text-center md:col-span-2 xl:col-span-3">
                <MapPin className="size-10 mx-auto text-muted-foreground" />
                <p className="mt-3">Search to discover businesses on Google Maps.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportCSV}><Download className="size-4 mr-1" />Export CSV</Button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {savedLeads.map((l: any) => (
              <Card key={l.id} className="surface-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium">{l.business_name}</p>
                  <Badge variant={l.score === "high" ? "default" : "secondary"} className="capitalize">{l.score}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{l.address}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {l.rating != null && <span>★ {l.rating} ({l.review_count ?? 0})</span>}
                  {l.phone && <span>{l.phone}</span>}
                  {l.website && <a className="text-primary hover:underline" href={l.website} target="_blank" rel="noreferrer">{l.website}</a>}
                </div>
                <Badge variant="outline" className="capitalize">{l.status.replace("_", " ")}</Badge>
              </Card>
            ))}
            {savedLeads.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No saved leads yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
