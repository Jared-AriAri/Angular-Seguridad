import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { GroupService } from "../pages/group/group.service";
import { TicketService } from "../pages/group/ticket.service";
import { AuthContextService } from "../shared/auth-context.service";
import type { Group } from "../pages/group/group.model";
import type { Ticket } from "../pages/group/ticket.model";
import type { Permission } from "../pages/user/user.model";

type StoredUser = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
  permissions: Permission[];
};

type QuickFilter = "all" | "mine" | "unassigned" | "high";

type GroupMember = {
  username: string;
  fullName: string;
  email: string;
};

const USERS_STORAGE_KEY = "demo_users";
const GROUP_MEMBERS_STORAGE_KEY = "group_members";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TagModule,
    ButtonModule,
    ChartModule,
  ],
  templateUrl: "./home.html",
})
export class HomePage implements OnInit {
  version = "v1";
  llmModel = "No configurado";

  groups: Group[] = [];
  tickets: Ticket[] = [];
  users: StoredUser[] = [];
  filteredRecentTickets: Ticket[] = [];

  activeQuickFilter: QuickFilter = "all";

  stats = {
    total: 0,
    pendientes: 0,
    enProgreso: 0,
    revision: 0,
    finalizados: 0,
    bloqueados: 0,
  };

  chartData: any;
  chartOptions: any;

  quickActions: { label: string; route: string }[] = [];

  constructor(
    private groupService: GroupService,
    private ticketService: TicketService,
    private authContext: AuthContextService
  ) { }

  ngOnInit() {
    this.groupService.seedIfEmpty();
    this.ticketService.seedIfEmpty();

    this.llmModel = this.resolveLlmModel();
    this.loadUsers();
    this.quickActions = this.buildQuickActions();

    this.groupService.groups$.subscribe((groups) => {
      this.groups = this.filterGroupsForCurrentUser(groups ?? []);
      this.loadTickets();
    });
  }

  hasPermission(permission: Permission) {
    return this.authContext.hasPermission(permission);
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      this.users = [];
    }
  }

  loadTickets() {
    const visibleGroupIds = new Set(this.groups.map((group) => group.id));
    const currentUsername = (this.getCurrentUsername() || "").trim().toLowerCase();

    const groupScopedTickets = (this.ticketService.getAll() ?? []).filter((ticket) =>
      visibleGroupIds.has(ticket.groupId)
    );

    this.tickets = groupScopedTickets.filter(
      (ticket) =>
        (ticket.assignedTo || "").trim().toLowerCase() === currentUsername
    );

    this.stats = {
      total: this.tickets.length,
      pendientes: this.tickets.filter(
        (t) => t.status === "pendiente" || t.status === "pending"
      ).length,
      enProgreso: this.tickets.filter(
        (t) => t.status === "en_progreso" || t.status === "in_progress"
      ).length,
      revision: this.tickets.filter(
        (t) => t.status === "revision" || t.status === "review"
      ).length,
      finalizados: this.tickets.filter(
        (t) => t.status === "finalizado" || t.status === "completed"
      ).length,
      bloqueados: this.tickets.filter(
        (t) => t.status === "bloqueado" || t.status === "blocked"
      ).length,
    };

    this.applyQuickFilter(this.activeQuickFilter);
    this.buildChart();
  }

  applyQuickFilter(filter: QuickFilter) {
    this.activeQuickFilter = filter;

    const currentUsername = (this.getCurrentUsername() || "").trim().toLowerCase();
    let data = [...this.tickets];

    if (filter === "mine") {
      data = data.filter(
        (t) =>
          (t.assignedTo || "").trim().toLowerCase() === currentUsername
      );
    }

    if (filter === "unassigned") {
      data = data.filter((t) => !t.assignedTo || !t.assignedTo.trim());
    }

    if (filter === "high") {
      data = data.filter(
        (t) =>
          t.priority === "alta" ||
          t.priority === "highest" ||
          t.priority === "high"
      );
    }

    this.filteredRecentTickets = data
      .sort((a, b) => this.getTicketSortDate(b) - this.getTicketSortDate(a))
      .slice(0, 6);
  }

  getTicketsByGroup(groupId: string) {
    return this.tickets.filter((t) => t.groupId === groupId).length;
  }

  getGroupRoute(groupId: string) {
    return ["/app/group", groupId];
  }

  getStatusLabel(status: Group["status"]) {
    return status === "active" ? "Activo" : "Inactivo";
  }

  getTicketStatusLabel(status: string | null | undefined) {
    switch (status) {
      case "pendiente":
      case "pending":
        return "Pendiente";

      case "en_progreso":
      case "in_progress":
        return "En progreso";

      case "revision":
      case "review":
        return "Revisión";

      case "finalizado":
      case "completed":
        return "Finalizado";

      case "bloqueado":
      case "blocked":
        return "Bloqueado";

      default:
        return status || "Sin estado";
    }
  }

  getTicketStatusSeverity(
    status: string | null | undefined
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case "pendiente":
      case "pending":
        return "warn";

      case "en_progreso":
      case "in_progress":
        return "info";

      case "revision":
      case "review":
        return "contrast";

      case "finalizado":
      case "completed":
        return "success";

      case "bloqueado":
      case "blocked":
        return "danger";

      default:
        return "secondary";
    }
  }

  getPriorityLabel(ticket: Ticket) {
    switch (ticket.priority) {
      case "alta":
      case "highest":
      case "high":
        return "Alta";

      case "media":
      case "medium_high":
      case "medium":
      case "medium_low":
        return "Media";

      case "baja":
      case "low":
      case "lowest":
        return "Baja";

      default:
        return "Sin prioridad";
    }
  }

  getAssignedToLabel(ticket: Ticket) {
    if (!ticket.assignedTo || !ticket.assignedTo.trim()) {
      return "Sin asignar";
    }

    const assigned = ticket.assignedTo.trim().toLowerCase();

    const userByUsername = this.users.find(
      (u) => u.username.trim().toLowerCase() === assigned
    );

    if (userByUsername) {
      return userByUsername.fullName?.trim() || userByUsername.username;
    }

    const userByEmail = this.users.find(
      (u) => u.email.trim().toLowerCase() === assigned
    );

    if (userByEmail) {
      return userByEmail.fullName?.trim() || userByEmail.username;
    }

    return ticket.assignedTo;
  }

  getDueDateLabel(ticket: Ticket) {
    if (!ticket.dueDate) return "Sin fecha";

    const parsed = new Date(ticket.dueDate);
    if (Number.isNaN(parsed.getTime())) return String(ticket.dueDate);

    return parsed.toLocaleDateString("es-MX");
  }

  private buildQuickActions() {
    const actions: { label: string; route: string; permission: Permission }[] = [
      { label: "Ir a grupos", route: "/app/group", permission: "group:view" },
      { label: "Usuarios", route: "/app/user", permission: "user:view" },
    ];

    return actions
      .filter((action) => this.authContext.hasPermission(action.permission))
      .map(({ label, route }) => ({ label, route }));
  }

  private buildChart() {
    this.chartData = {
      labels: ["Pendientes", "En progreso", "Revisión", "Finalizados", "Bloqueados"],
      datasets: [
        {
          label: "Tickets",
          data: [
            this.stats.pendientes,
            this.stats.enProgreso,
            this.stats.revision,
            this.stats.finalizados,
            this.stats.bloqueados,
          ],
          backgroundColor: [
            "rgba(249, 115, 22, 0.85)",
            "rgba(56, 189, 248, 0.85)",
            "rgba(226, 232, 240, 0.85)",
            "rgba(74, 222, 128, 0.85)",
            "rgba(239, 68, 68, 0.85)",
          ],
          borderRadius: 10,
          maxBarThickness: 42,
        },
      ],
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#94a3b8", precision: 0 },
          grid: { color: "rgba(148, 163, 184, 0.12)" },
        },
      },
    };
  }

  private getTicketSortDate(ticket: Ticket): number {
    const possibleDates = [ticket.createdAt, ticket.dueDate];

    for (const value of possibleDates) {
      if (!value) continue;
      const parsed = new Date(value).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }

    return 0;
  }

  private getCurrentUsername(): string | null {
    return this.authContext.getCurrentUsername();
  }

  private filterGroupsForCurrentUser(groups: Group[]) {
    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return [];

    if (this.authContext.hasPermission("group:members")) {
      return groups;
    }

    const membershipMap = this.loadGroupMembers();

    return groups.filter((group) => {
      const members = membershipMap[group.id] || [];

      return members.some(
        (member) =>
          (member.username || "").trim().toLowerCase() ===
          currentUser.username.trim().toLowerCase()
      );
    });
  }

  private loadGroupMembers(): Record<string, GroupMember[]> {
    try {
      const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private resolveLlmModel(): string {
    const directKeys = [
      "llmModel",
      "selectedLLM",
      "selectedLlm",
      "model",
      "aiModel",
    ];

    for (const key of directKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value;
    }

    const jsonKeys = ["settings", "appSettings", "preferences"];

    for (const key of jsonKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);

        const value =
          parsed?.llmModel ||
          parsed?.selectedLLM ||
          parsed?.selectedLlm ||
          parsed?.model ||
          parsed?.aiModel;

        if (value && String(value).trim()) return String(value);
      } catch { }
    }

    return "No configurado";
  }
}