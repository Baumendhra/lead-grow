import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft,
  Layers, DollarSign, Calendar, Building2, Trash2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  active:     { label: "Active",     color: "text-blue-500",  badge: "default" },
  completed:  { label: "Completed",  color: "text-green-500", badge: "secondary" },
  on_hold:    { label: "On Hold",    color: "text-amber-500", badge: "outline" },
};

function ProjectsPage() {
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string>("all");
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  // New Project State
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectPrice, setNewProjectPrice] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState("none");
  const [newProjectStatus, setNewProjectStatus] = useState("active");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");

  // New Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  // Delete confirm state
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, company").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await (supabase as any)
        .from("projects")
        .select("*, clients(id, name, company)")
        .order("created_at", { ascending: false });
      if (res.error) throw res.error;
      return (res.data ?? []) as any[];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", activeProjectId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*, projects(name)");
      if (activeProjectId !== "all") {
        q = q.eq("project_id", activeProjectId);
      }
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await (supabase as any).from("projects").insert({
        name: newProjectName,
        description: newProjectDesc,
        sold_price: newProjectPrice ? Number(newProjectPrice) : undefined,
        client_id: newProjectClientId === "none" ? undefined : newProjectClientId,
        status: newProjectStatus,
        deadline: newProjectDeadline || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      setProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectPrice("");
      setNewProjectClientId("none");
      setNewProjectStatus("active");
      setNewProjectDeadline("");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const pid = activeProjectId === "all" ? (projects[0]?.id || null) : activeProjectId;
      if (!pid && projects.length === 0) throw new Error("Create a project first");
      const { error } = await (supabase as any).from("tasks").insert({
        project_id: pid,
        title: newTaskTitle,
        priority: newTaskPriority,
        deadline: newTaskDeadline || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created");
      setTaskModalOpen(false);
      setNewTaskTitle("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      setDeleteProjectId(null);
      if (activeProjectId === deleteProjectId) setActiveProjectId("all");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      setDeleteTaskId(null);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const kanbanColumns = [
    { id: "todo",        title: "To Do",       icon: AlertCircle,   color: "text-blue-500" },
    { id: "in_progress", title: "In Progress",  icon: Clock,         color: "text-amber-500" },
    { id: "done",        title: "Done",         icon: CheckCircle2,  color: "text-green-500" },
  ];

  function getNextStatus(status: string) {
    if (status === "todo") return "in_progress";
    if (status === "in_progress") return "done";
    return null;
  }
  function getPrevStatus(status: string) {
    if (status === "done") return "in_progress";
    if (status === "in_progress") return "todo";
    return null;
  }

  const totalRevenue = projects.reduce((s, p) => s + Number(p.sold_price || 0), 0);
  const activeProject = activeProjectId !== "all" ? projects.find(p => p.id === activeProjectId) : null;

  return (
    <div className="space-y-6">
      {/* Delete Project Confirm */}
      <Dialog open={!!deleteProjectId} onOpenChange={v => !v && setDeleteProjectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete project?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">All tasks in this project will also be deleted. This cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteProjectId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteProject.mutate(deleteProjectId!)} disabled={deleteProject.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirm */}
      <Dialog open={!!deleteTaskId} onOpenChange={v => !v && setDeleteTaskId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete task?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTaskId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteTask.mutate(deleteTaskId!)} disabled={deleteTask.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Projects & Tasks</h1>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""} · Total value: ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
        <Dialog open={isProjectModalOpen} onOpenChange={setProjectModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="size-4 mr-2" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Project Name *</Label>
                <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Website Redesign" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief description..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sold Price (₹)</Label>
                  <div className="relative">
                    <DollarSign className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={newProjectPrice}
                      onChange={e => setNewProjectPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline</Label>
                  <div className="relative">
                    <Calendar className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="date" className="pl-9" value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={newProjectClientId} onValueChange={setNewProjectClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Client —</SelectItem>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.company ? ` (${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={newProjectStatus} onValueChange={setNewProjectStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => createProject.mutate()} disabled={!newProjectName || createProject.isPending} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Projects List ─── */}
      {projects.length === 0 ? (
        <Card className="surface-card p-10 text-center">
          <Layers className="size-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">Create your first project above.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.active;
            const isSelected = activeProjectId === p.id;
            return (
              <Card
                key={p.id}
                onClick={() => setActiveProjectId(isSelected ? "all" : p.id)}
                className={[
                  "surface-card p-4 cursor-pointer transition-all hover:border-primary/60",
                  isSelected ? "ring-2 ring-primary border-primary/50" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-sm leading-snug">{p.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={cfg.badge} className="text-[10px] capitalize">{cfg.label}</Badge>
                    <Button size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteProjectId(p.id); }}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {p.clients && (
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3" /> {p.clients.name}
                    </span>
                  )}
                  {p.sold_price && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <DollarSign className="size-3" /> ₹{Number(p.sold_price).toLocaleString()}
                    </span>
                  )}
                  {p.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> {new Date(p.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <p className="mt-3 text-xs text-primary font-medium">Showing tasks for this project ↓</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Task Kanban ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">
            {activeProject ? `Tasks — ${activeProject.name}` : "All Tasks"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeProjectId === "all" ? "Viewing tasks from all projects" : "Click a project card to filter · click again to show all"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeProjectId} onValueChange={setActiveProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isTaskModalOpen} onOpenChange={setTaskModalOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="e.g. Design Homepage" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deadline</Label>
                    <Input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                  </div>
                </div>
                {activeProjectId === "all" && projects.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Task will be added to: <strong>{projects[0]?.name}</strong>. Select a specific project to assign elsewhere.
                  </p>
                )}
                <Button onClick={() => createTask.mutate()} disabled={!newTaskTitle || createTask.isPending} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-5 min-h-[400px]">
        {kanbanColumns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col bg-muted/40 rounded-xl border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <col.icon className={`size-5 ${col.color}`} />
                  <h3 className="font-semibold">{col.title}</h3>
                </div>
                <Badge variant="secondary">{colTasks.length}</Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-1">
                {colTasks.length === 0 && (
                  <div className="text-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No tasks
                  </div>
                )}
                {colTasks.map(task => (
                  <Card key={task.id} className="surface-card group shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm leading-snug">{task.title}</h4>
                        {activeProjectId === "all" && task.projects && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Layers className="size-3" /> {(task.projects as any).name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${task.priority === "high" ? "border-red-500 text-red-500" : task.priority === "low" ? "border-muted-foreground/50" : ""}`}
                        >
                          {task.priority}
                        </Badge>
                        {task.deadline && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                            <Calendar className="size-3" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t flex justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs flex-1"
                          disabled={!getPrevStatus(task.status)}
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: getPrevStatus(task.status)! })}
                        >
                          <ChevronLeft className="size-3 mr-1" /> Prev
                        </Button>
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs flex-1"
                          disabled={!getNextStatus(task.status)}
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: getNextStatus(task.status)! })}
                        >
                          Next <ChevronRight className="size-3 ml-1" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
