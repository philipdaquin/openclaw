import fs from "node:fs";
import path from "node:path";
import { appDataDir } from "../../utils/app-info.js";

const DASHBOARD_FILE = "dashboard.json";

export interface DashboardTask {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  projects: Array<{ id: string; name: string; tasks: string[] }>;
  tasks: DashboardTask[];
  updatedAt: string;
}

export function getDashboardTasks(assignee?: string, status?: DashboardTask["status"]): DashboardTask[] {
  const dashboardPath = path.join(appDataDir(), DASHBOARD_FILE);
  try {
    if (fs.existsSync(dashboardPath)) {
      const raw = fs.readFileSync(dashboardPath, "utf-8");
      const data: DashboardData = JSON.parse(raw);
      return data.tasks.filter((t) => {
        if (assignee && t.assignee !== assignee) return false;
        if (status && t.status !== status) return false;
        return true;
      });
    }
  } catch (err) {
    console.error("[dashboard] failed to read:", err);
  }
  return [];
}

export function getMyInProgressTasks(agentName: string): DashboardTask[] {
  return getDashboardTasks(agentName, "in_progress");
}

export function getUnassignedInProgressTasks(): DashboardTask[] {
  return getDashboardTasks(undefined, "in_progress");
}
