import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { supabase } from "./client-CzlCT6DG.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { C as Card, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle } from "./dialog-DjVQhB97.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as Plus, j as CircleAlert, k as Clock, l as CircleCheck, m as ChevronLeft, n as ChevronRight } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
function ProjectsPage() {
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = reactExports.useState("all");
  const [isProjectModalOpen, setProjectModalOpen] = reactExports.useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = reactExports.useState(false);
  const [newProjectName, setNewProjectName] = reactExports.useState("");
  const [newProjectDesc, setNewProjectDesc] = reactExports.useState("");
  const [newTaskTitle, setNewTaskTitle] = reactExports.useState("");
  const [newTaskDesc, setNewTaskDesc] = reactExports.useState("");
  const [newTaskPriority, setNewTaskPriority] = reactExports.useState("medium");
  const [newTaskDeadline, setNewTaskDeadline] = reactExports.useState("");
  const {
    data: user
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user
  });
  const {
    data: projects = []
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("projects").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const {
    data: tasks = []
  } = useQuery({
    queryKey: ["tasks", activeProjectId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*, projects(name)");
      if (activeProjectId !== "all") {
        q = q.eq("project_id", activeProjectId);
      }
      const {
        data,
        error
      } = await q.order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const createProject = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const {
        error
      } = await supabase.from("projects").insert({
        name: newProjectName,
        description: newProjectDesc,
        created_by: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      setProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      qc.invalidateQueries({
        queryKey: ["projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const createTask = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const pid = activeProjectId === "all" ? projects[0]?.id || null : activeProjectId;
      if (!pid && activeProjectId !== "all") throw new Error("Select a project first");
      const {
        error
      } = await supabase.from("tasks").insert({
        project_id: pid,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        deadline: newTaskDeadline || null,
        created_by: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created");
      setTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      qc.invalidateQueries({
        queryKey: ["tasks"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const updateTaskStatus = useMutation({
    mutationFn: async ({
      id,
      status
    }) => {
      const {
        error
      } = await supabase.from("tasks").update({
        status
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["tasks"]
    }),
    onError: (e) => toast.error(e.message)
  });
  const columns = [{
    id: "todo",
    title: "To Do",
    icon: CircleAlert,
    color: "text-blue-500"
  }, {
    id: "in_progress",
    title: "In Progress",
    icon: Clock,
    color: "text-amber-500"
  }, {
    id: "done",
    title: "Done",
    icon: CircleCheck,
    color: "text-green-500"
  }];
  function getNextStatus(status) {
    if (status === "todo") return "in_progress";
    if (status === "in_progress") return "done";
    return null;
  }
  function getPrevStatus(status) {
    if (status === "done") return "in_progress";
    if (status === "in_progress") return "todo";
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold", children: "Projects & Tasks" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Manage project deliverables and team assignments." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: activeProjectId, onValueChange: setActiveProjectId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Project" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Projects" }),
            projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isProjectModalOpen, onOpenChange: setProjectModalOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-2" }),
            " New Project"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Project" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Project Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newProjectName, onChange: (e) => setNewProjectName(e.target.value), placeholder: "e.g. Website Redesign" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newProjectDesc, onChange: (e) => setNewProjectDesc(e.target.value), placeholder: "Brief description..." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createProject.mutate(), disabled: !newProjectName || createProject.isPending, className: "w-full", children: "Create Project" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isTaskModalOpen, onOpenChange: setTaskModalOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-2" }),
            " New Task"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Task" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newTaskTitle, onChange: (e) => setNewTaskTitle(e.target.value), placeholder: "e.g. Design Homepage" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Priority" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newTaskPriority, onValueChange: setNewTaskPriority, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "high", children: "High" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "Low" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Deadline" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: newTaskDeadline, onChange: (e) => setNewTaskDeadline(e.target.value) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createTask.mutate(), disabled: !newTaskTitle || createTask.isPending, className: "w-full", children: "Create Task" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)] overflow-hidden", children: columns.map((col) => {
      const colTasks = tasks.filter((t) => t.status === col.id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col bg-muted/40 rounded-lg border p-4 h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(col.icon, { className: `size-5 ${col.color}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: col.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: colTasks.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto space-y-3 pr-2 pb-2", children: [
          colTasks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg", children: "No tasks" }),
          colTasks.map((task) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "surface-card group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm", children: task.title }),
              activeProjectId === "all" && task.projects && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "Project: ",
                task.projects.name
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `text-[10px] uppercase ${task.priority === "high" ? "border-red-500 text-red-500" : ""}`, children: task.priority }),
              task.deadline && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground flex items-center bg-muted px-2 py-0.5 rounded-full", children: new Date(task.deadline).toLocaleDateString() })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t flex justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs flex-1", disabled: !getPrevStatus(task.status), onClick: () => updateTaskStatus.mutate({
                id: task.id,
                status: getPrevStatus(task.status)
              }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-3 mr-1" }),
                " Prev"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs flex-1", disabled: !getNextStatus(task.status), onClick: () => updateTaskStatus.mutate({
                id: task.id,
                status: getNextStatus(task.status)
              }), children: [
                "Next ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3 ml-1" })
              ] })
            ] })
          ] }) }, task.id))
        ] })
      ] }, col.id);
    }) })
  ] });
}
export {
  ProjectsPage as component
};
