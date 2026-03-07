import { html } from "lit";
import { t } from "../../i18n/index.ts";

export type DashboardTask = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardProject = {
  id: string;
  name: string;
  description?: string;
  tasks: string[];
  createdAt: string;
};

export type DashboardData = {
  projects: DashboardProject[];
  tasks: DashboardTask[];
  updatedAt: string;
};

export type DashboardProps = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  currentUser: string;
  onRefresh: () => void;
  onTaskCreate: (title: string, description?: string, assignee?: string) => void;
  onTaskUpdate: (id: string, updates: Partial<DashboardTask>) => void;
  onTaskDelete: (id: string) => void;
  onProjectCreate: (name: string, description?: string) => void;
  onProjectSelect: (projectId: string | null) => void;
};

const COLUMNS = [
  { id: "pending", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
] as const;

export function renderDashboard(props: DashboardProps) {
  const { data, loading, error, selectedProjectId, currentUser, onRefresh, onTaskCreate, onTaskUpdate, onTaskDelete, onProjectCreate, onProjectSelect } = props;

  if (loading) {
    return html`<div class="view-loading">${t("common.loading")}</div>`;
  }

  if (error) {
    return html`
      <div class="view-error">
        <p>${error}</p>
        <button class="btn" @click=${onRefresh}>${t("common.retry")}</button>
      </div>
    `;
  }

  const tasks = data?.tasks ?? [];
  const projects = data?.projects ?? [];
  const filteredTasks = selectedProjectId 
    ? tasks.filter((t) => projects.find((p) => p.id === selectedProjectId)?.tasks.includes(t.id))
    : tasks;

  const myTasks = tasks.filter((t) => t.assignee === currentUser && t.status !== "done");
  const unassignedTasks = tasks.filter((t) => !t.assignee);

  return html`
    <div class="dashboard-view">
      <div class="dashboard-header">
        <h2>${t("tabs.dashboard") || "Dashboard"}</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" @click=${onRefresh}>Refresh</button>
          <button class="btn btn-primary" @click=${() => {
            const title = prompt("Task title:");
            if (title) {
              const assignToMe = confirm("Assign to me?");
              onTaskCreate(title, undefined, assignToMe ? currentUser : undefined);
            }
          }}>+ New Task</button>
        </div>
      </div>

      ${myTasks.length > 0 ? html`
        <div class="my-tasks-banner">
          <strong>My Tasks (${myTasks.length}):</strong>
          ${myTasks.map((task) => html`
            <span class="my-task-tag status-${task.status}">${task.title}</span>
          `)}
        </div>
      ` : ''}

      <div class="dashboard-filters">
        <select @change=${(e: Event) => {
          const val = (e.target as HTMLSelectElement).value;
          onProjectSelect(val || null);
        }}>
          <option value="">All Projects</option>
          ${projects.map((p) => html`
            <option value=${p.id} ?selected=${p.id === selectedProjectId}>${p.name}</option>
          `)}
        </select>
        <button class="btn btn-small" @click=${() => {
          const name = prompt("Project name:");
          if (name) onProjectCreate(name);
        }}>+ Project</button>
      </div>

      <div class="kanban-board">
        ${COLUMNS.map((col) => html`
          <div class="kanban-column">
            <div class="column-header">
              <h3>${col.label}</h3>
              <span class="task-count">${filteredTasks.filter((t) => t.status === col.id).length}</span>
            </div>
            <div class="column-content">
              ${filteredTasks
                .filter((t) => t.status === col.id)
                .map((task) => html`
                  <div class="task-card ${task.assignee === currentUser ? 'assigned-to-me' : ''}">
                    <div class="task-card-header">
                      ${task.assignee ? html`
                        <span class="assignee-badge">@${task.assignee}</span>
                      ` : html`
                        <span class="assignee-badge unassigned">Unassigned</span>
                      `}
                      <div class="task-actions">
                        <button class="btn-icon" @click=${() => onTaskDelete(task.id)} title="Delete">×</button>
                      </div>
                    </div>
                    <div class="task-title">${task.title}</div>
                    ${task.description ? html`<div class="task-desc">${task.description}</div>` : ''}
                    <div class="task-card-footer">
                      <select 
                        @change=${(e: Event) => {
                          const status = (e.target as HTMLSelectElement).value as DashboardTask["status"];
                          onTaskUpdate(task.id, { status });
                        }}
                        .value=${task.status}
                      >
                        <option value="pending">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      ${task.assignee !== currentUser ? html`
                        <button class="btn btn-small" @click=${() => onTaskUpdate(task.id, { assignee: currentUser })}>
                          Assign to me
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `)}
              ${filteredTasks.filter((t) => t.status === col.id).length === 0 ? html`
                <div class="empty-column">No tasks</div>
              ` : ''}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}
