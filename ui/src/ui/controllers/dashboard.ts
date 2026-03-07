import type { DashboardData, DashboardTask } from "../views/dashboard.ts";

let dashboardCache: DashboardData | null = null;

export async function loadDashboard(): Promise<DashboardData> {
  try {
    const { gateway } = await import("../app.js");
    if (!gateway || !gateway.connected) {
      dashboardCache = { projects: [], tasks: [], updatedAt: new Date().toISOString() };
      return dashboardCache;
    }
    const data = await gateway.request<DashboardData>("dashboard");
    dashboardCache = data;
    return data;
  } catch (err) {
    console.error("[dashboard] failed to load:", err);
    dashboardCache = { projects: [], tasks: [], updatedAt: new Date().toISOString() };
    return dashboardCache;
  }
}

export async function createTask(title: string, description?: string, assignee?: string): Promise<DashboardTask | null> {
  try {
    const { gateway } = await import("../app.js");
    if (!gateway?.connected) return null;
    const task = await gateway.request<DashboardTask>("dashboard.task.create", { title, description, assignee });
    dashboardCache = null;
    return task;
  } catch (err) {
    console.error("[dashboard] failed to create task:", err);
    return null;
  }
}

export async function updateTask(id: string, updates: Partial<DashboardTask>): Promise<DashboardTask | null> {
  try {
    const { gateway } = await import("../app.js");
    if (!gateway?.connected) return null;
    const task = await gateway.request<DashboardTask>("dashboard.task.update", { id, ...updates });
    dashboardCache = null;
    return task;
  } catch (err) {
    console.error("[dashboard] failed to update task:", err);
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { gateway } = await import("../app.js");
    if (!gateway?.connected) return false;
    await gateway.request("dashboard.task.delete", { id });
    dashboardCache = null;
    return true;
  } catch (err) {
    console.error("[dashboard] failed to delete task:", err);
    return false;
  }
}

export async function createProject(name: string, description?: string): Promise<{ id: string } | null> {
  try {
    const { gateway } = await import("../app.js");
    if (!gateway?.connected) return null;
    const project = await gateway.request<{ id: string }>("dashboard.project.create", { name, description });
    dashboardCache = null;
    return project;
  } catch (err) {
    console.error("[dashboard] failed to create project:", err);
    return null;
  }
}

export function getDashboardCache(): DashboardData | null {
  return dashboardCache;
}
