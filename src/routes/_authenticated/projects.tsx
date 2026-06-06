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
import { Plus, Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string>("all");
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  // New Project State
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // New Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("projects").insert({
        name: newProjectName,
        description: newProjectDesc,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      setProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const pid = activeProjectId === "all" ? (projects[0]?.id || null) : activeProjectId;
      if (!pid && activeProjectId !== "all") throw new Error("Select a project first");
      
      const { error } = await supabase.from("tasks").insert({
        project_id: pid,
        title: newTaskTitle,
        description: newTaskDesc,
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
      setNewTaskDesc("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { id: "todo", title: "To Do", icon: AlertCircle, color: "text-blue-500" },
    { id: "in_progress", title: "In Progress", icon: Clock, color: "text-amber-500" },
    { id: "done", title: "Done", icon: CheckCircle2, color: "text-green-500" }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Projects & Tasks</h1>
          <p className="text-muted-foreground">Manage project deliverables and team assignments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={activeProjectId} onValueChange={setActiveProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isProjectModalOpen} onOpenChange={setProjectModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="size-4 mr-2" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Website Redesign" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief description..." />
                </div>
                <Button onClick={() => createProject.mutate()} disabled={!newProjectName || createProject.isPending} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskModalOpen} onOpenChange={setTaskModalOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="e.g. Design Homepage" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                  </div>
                </div>
                <Button onClick={() => createTask.mutate()} disabled={!newTaskTitle || createTask.isPending} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)] overflow-hidden">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col bg-muted/40 rounded-lg border p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <col.icon className={`size-5 ${col.color}`} />
                  <h3 className="font-semibold">{col.title}</h3>
                </div>
                <Badge variant="secondary">{colTasks.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
                {colTasks.length === 0 && (
                  <div className="text-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No tasks
                  </div>
                )}
                {colTasks.map(task => (
                  <Card key={task.id} className="surface-card group">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {activeProjectId === "all" && task.projects && (
                          <p className="text-xs text-muted-foreground mt-1">Project: {(task.projects as any).name}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={`text-[10px] uppercase ${task.priority === 'high' ? 'border-red-500 text-red-500' : ''}`}>
                            {task.priority}
                          </Badge>
                          {task.deadline && (
                            <span className="text-[10px] text-muted-foreground flex items-center bg-muted px-2 py-0.5 rounded-full">
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
