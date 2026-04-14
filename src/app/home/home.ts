import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { TableModule } from "primeng/table";
import { SelectModule } from "primeng/select";
import { DividerModule } from "primeng/divider";
import { TooltipModule } from "primeng/tooltip";

import { GroupService } from "../core/services/group.service";
import { TicketService } from "../core/services/ticket.service";
import { AuthService } from "../core/services/auth.service";
import { CreateTicketModalComponent } from "../pages/tickets/components/create-ticket-modal/create-ticket-modal";
import { TicketDetailModalComponent } from "../pages/tickets/components/ticket-detail-modal/ticket-detail-modal";

import type { Group } from "../core/models/group.model";
import type { Ticket } from "../core/models/ticket.model";
import { filter, take, firstValueFrom } from "rxjs";

type QuickFilter = "all" | "mine" | "unassigned" | "high";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    TagModule,
    ButtonModule,
    ChartModule,
    TableModule,
    SelectModule,
    DividerModule,
    TooltipModule,
    CreateTicketModalComponent,
    TicketDetailModalComponent
  ],
  templateUrl: "./home.html"
})
export class HomePage implements OnInit {
  private groupService = inject(GroupService);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  version = "v1.6";
  llmModel = "No configurado";
  groups: Group[] = [];
  selectedGroup: Group | null = null;
  tickets: Ticket[] = [];
  filteredRecentTickets: Ticket[] = [];
  activeQuickFilter: QuickFilter = "all";
  loading = true;
  showCreateModal = false;
  showDetailModal = false;
  selectedTicket: Ticket | null = null;
  clickCount = 0;
  private currentUser: any = null;

  stats = { total: 0, pendientes: 0, enProgreso: 0, revision: 0, finalizados: 0, bloqueados: 0 };
  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.authService.initialized$.pipe(
      filter(init => init === true),
      take(1)
    ).subscribe(() => {
      setTimeout(async () => {
        this.llmModel = localStorage.getItem("llmModel") || "No configurado";
        if (this.hasPermission("group:view")) {
          await this.loadGroups();
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  async loadGroups() {
    try {
      const user = await firstValueFrom(this.authService.currentUser$);
      if (!user) return;

      const res: any = await this.groupService.getMyGroups(user.id);
      this.groups = res?.data || res || [];

      if (this.groups.length > 0) {
        this.selectedGroup = this.groups[0];
        await this.loadTickets();
      }
    } catch (e) {
      this.groups = [];
    }
  }

  async onGroupChange() {
    if (this.selectedGroup) {
      await this.loadTickets();
    }
  }

  async loadTickets() {
    if (!this.selectedGroup) return;
    try {
      this.tickets = await this.ticketService.getByGroup(this.selectedGroup.id);
      this.updateStats();
    } catch (e) {
      this.tickets = [];
      this.updateStats();
    }
  }

  private updateStats() {
    this.stats = {
      total: this.tickets.length,
      pendientes: this.countByStatus("pendiente"),
      enProgreso: this.countByStatus("en progreso"),
      revision: this.countByStatus("revision"),
      finalizados: this.countByStatus("finalizado"),
      bloqueados: this.countByStatus("bloqueado"),
    };
    this.applyQuickFilter(this.activeQuickFilter);
    this.buildChart();
    this.cdr.detectChanges();
  }

  goToKanban() {
    if (this.selectedGroup) {
      this.router.navigate(['/app/group', this.selectedGroup.id]);
    }
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.showDetailModal = true;
  }

  onDetailClose() {
    this.showDetailModal = false;
    this.selectedTicket = null;
    this.loadTickets();
  }

  openCreateTicket() {
    this.showCreateModal = true;
  }

  hasPermission(p: string): boolean {
    return this.authService.hasPermission(p as any);
  }

  private normalizeStr(str?: string | null) {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  }

  private countByStatus(n: string) {
    return this.tickets.filter(t => this.normalizeStr(t.estados?.nombre) === n).length;
  }

  async applyQuickFilter(f: QuickFilter) {
    this.activeQuickFilter = f;
    let data = [...this.tickets];
    const user = await firstValueFrom(this.authService.currentUser$);

    if (f === "mine" && user) {
      data = data.filter(t => t.asignado_id === user.id || t.autor_id === user.id);
    } else if (f === "high") {
      data = data.filter(t => {
        const p = this.normalizeStr(t.prioridades?.nombre);
        return p === "alta" || p === "urgente";
      });
    }

    this.filteredRecentTickets = data
      .sort((a, b) => new Date(b.creado_en || 0).getTime() - new Date(a.creado_en || 0).getTime())
      .slice(0, 5);
  }

  getTicketStatusLabel(t: Ticket) {
    return t.estados?.nombre || "Sin estado";
  }

  getTicketStatusSeverity(t: Ticket): any {
    const s = this.normalizeStr(t.estados?.nombre);
    const map: Record<string, string> = {
      'pendiente': 'warn',
      'en progreso': 'info',
      'revision': 'contrast',
      'finalizado': 'success',
      'bloqueado': 'danger'
    };
    return map[s] || 'secondary';
  }

  getPriorityLabel(t: Ticket) {
    return t.prioridades?.nombre || "N/A";
  }

  private buildChart() {
    this.chartData = {
      labels: ["Pendientes", "En Progreso", "Revisión", "Finalizados"],
      datasets: [{
        data: [this.stats.pendientes, this.stats.enProgreso, this.stats.revision, this.stats.finalizados],
        backgroundColor: ["#F97316", "#3B82F6", "#64748B", "#22C55E"]
      }]
    };
    this.chartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { display: false } }
      }
    };
  }

  logoClicked() {
    this.clickCount++;
    if (this.clickCount === 5) {
      this.clickCount = 0;
      alert("catch u");
    }
  }
}