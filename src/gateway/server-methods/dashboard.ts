import fs from "node:fs";
import path from "node:path";
import { appDataDir } from "../../utils/app-info.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

const DASHBOARD_FILE = "dashboard.json";

interface DashboardTask {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardProject {
  id: string;
  name: string;
  description?: string;
  tasks: string[];
  createdAt: string;
}

interface DashboardData {
  projects: DashboardProject[];
  tasks: DashboardTask[];
  updatedAt: string;
}

function loadDashboardData(): DashboardData {
  const dashboardPath = path.join(appDataDir(), DASHBOARD_FILE);
  try {
    if (fs.existsSync(dashboardPath)) {
      const raw = fs.readFileSync(dashboardPath, "utf-8");
      return JSON.parse(raw) as DashboardData;
    }
  } catch (err) {
    console.error("[dashboard] failed to load:", err);
  }
  return { projects: [], tasks: [], updatedAt: new Date().toISOString() };
}

function saveDashboardData(data: DashboardData): void {
  const dashboardPath = path.join(appDataDir(), DASHBOARD_FILE);
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(dashboardPath, JSON.stringify(data, null, 2), "utf-8");
}

export const dashboardHandlers: GatewayRequestHandlers = {
  dashboard: async ({ respond }) => {
    const data = loadDashboardData();
    respond(true, data, undefined);
  },

  "dashboard.task.create": async ({ respond, params }) => {
    const { title, description, assignee } = params as {
      title: string;
      description?: string;
      assignee?: string;
    };
    if (!title) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "title required"));
      return;
    }
    const data = loadDashboardData();
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const newTask: DashboardTask = { id, title, description, status: "pending", assignee, createdAt: now, updatedAt: now };
    data.tasks.push(newTask);
    saveDashboardData(data);
    respond(true, newTask, undefined);
  },

  "dashboard.task.update": async ({ respond, params }) => {
    const { id, ...updates } = params as { id: string; title?: string; description?: string; status?: string; assignee?: string };
    if (!id) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "id required"));
      return;
    }
    const data = loadDashboardData();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      respond(false, undefined, errorShape(ErrorCodes.NOT_FOUND, "task not found"));
      return;
    }
    data.tasks[idx] = { ...data.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDashboardData(data);
    respond(true, data.tasks[idx], undefined);
  },

  "dashboard.task.delete": async ({ respond, params }) => {
    const { id } = params as { id: string };
    if (!id) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "id required"));
      return;
    }
    const data = loadDashboardData();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      respond(false, undefined, errorShape(ErrorCodes.NOT_FOUND, "task not found"));
      return;
    }
    data.tasks.splice(idx, 1);
    saveDashboardData(data);
    respond(true, { deleted: true }, undefined);
  },

  "dashboard.project.create": async ({ respond, params }) => {
    const { name, description } = params as { name: string; description?: string };
    if (!name) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "name required"));
      return;
    }
    const data = loadDashboardData();
    const id = `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newProject: DashboardProject = { id, name, description, tasks: [], createdAt: new Date().toISOString() };
    data.projects.push(newProject);
    saveDashboardData(data);
    respond(true, newProject, undefined);
  },
};
