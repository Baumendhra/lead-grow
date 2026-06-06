import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

function TeamPage() {
  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Team</h1>
        <p className="text-muted-foreground">{team.length} member{team.length === 1 ? "" : "s"}</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {team.map((m) => (
          <Card key={m.id} className="surface-card p-5 flex items-center gap-3">
            <div className="size-10 rounded-full bg-accent grid place-items-center"><Users className="size-5" /></div>
            <div className="flex-1">
              <p className="font-medium">{m.full_name || m.email}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {m.roles.map((r: string) => <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
