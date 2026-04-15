import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { filter, take } from "rxjs";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { SelectButtonModule } from "primeng/selectbutton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { MessageService, ConfirmationService } from "primeng/api";
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { GroupService } from "../../../../core/services/group.service";
import { TicketService } from "../../../../core/services/ticket.service";
import { AuthService } from "../../../../core/services/auth.service";

import type { Group } from "../../../../core/models/group.model";
import type { Ticket } from "../../../../core/models/ticket.model";
import { Permission } from "../../../../core/models/user.model";

import { TicketKanbanComponent } from "../../../tickets/ticket-kanban/ticket-kanban";
import { TicketListComponent } from "../../../tickets/ticket-list/ticket-list";
import { CreateTicketModalComponent } from "../../../tickets/components/create-ticket-modal/create-ticket-modal";
import { TicketDetailModalComponent } from "../../../tickets/components/ticket-detail-modal/ticket-detail-modal";
import { GroupMembersModalComponent } from "../group-members-modal/group-members-modal";

@Component({
  selector: "app-group-detail-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    SelectButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TicketKanbanComponent,
    TicketListComponent,
    CreateTicketModalComponent,
    TicketDetailModalComponent,
    GroupMembersModalComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./group-detail.page.html"
})
export class GroupDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private groupService = inject(GroupService);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  group: Group | null = null;
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  viewMode: "kanban" | "list" = "kanban";
  currentFilter: "all" | "mine" | "unassigned" | "high_priority" = "all";
  loading = true;

  viewOptions = [
    { label: "Kanban", value: "kanban" },
    { label: "Lista", value: "list" }
  ];

  showCreateModal = false;
  showDetailModal = false;
  showMembersModal = false;
  selectedTicket: Ticket | null = null;
  groupId = "";

  ngOnInit() {
    this.authService.initialized$.pipe(
      filter(init => init === true),
      take(1)
    ).subscribe(async () => {
      if (!this.hasPermission("group:view")) {
        this.router.navigate(["/app/home"]);
        return;
      }

      this.groupId = this.route.snapshot.paramMap.get("id") || "";

      this.route.queryParams.subscribe(params => {
        if (params['action'] === 'new-ticket') {
          this.openCreateTicket();
        }
      });

      await this.loadData();
    });
  }

  async loadData() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await Promise.all([
        this.loadGroup(),
        this.loadTickets()
      ]);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadGroup() {
    try {
      this.group = await this.groupService.getById(this.groupId);
      if (!this.group) {
        this.router.navigate(["/app/group"]);
      }
    } catch (error) {
      this.router.navigate(["/app/group"]);
    }
  }

  async loadTickets() {
    if (!this.hasPermission("ticket:view")) return;
    try {
      this.tickets = await this.ticketService.getByGroup(this.groupId);
      this.applyFilter(this.currentFilter);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets' });
    }
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission as Permission);
  }

  applyFilter(filterType: any) {
    this.currentFilter = filterType;
    const user = this.authService.getCurrentUser();

    if (filterType === "all") {
      this.filteredTickets = [...this.tickets];
    } else if (filterType === "mine") {
      this.filteredTickets = this.tickets.filter(t =>
        t.asignado_id === user?.id || t.autor_id === user?.id
      );
    } else if (filterType === "unassigned") {
      this.filteredTickets = this.tickets.filter(t => !t.asignado_id);
    } else if (filterType === "high_priority") {
      this.filteredTickets = this.tickets.filter(t => {
        const p = t.prioridades?.nombre?.toLowerCase();
        return p === 'alta' || p === 'urgente';
      });
    }
    this.cdr.detectChanges();
  }

  get totalTickets() {
    return this.tickets.length;
  }

  get pendingTickets() {
    return this.tickets.filter(t => {
      const s = t.estados?.nombre?.toLowerCase();
      return s !== 'finalizado' && s !== 'completado';
    }).length;
  }

  get completedTickets() {
    return this.tickets.filter(t => {
      const s = t.estados?.nombre?.toLowerCase();
      return s === 'finalizado' || s === 'completado';
    }).length;
  }

  canEditTicket(ticket: Ticket): boolean {
    if (!ticket) return false;
    const user = this.authService.getCurrentUser();
    if (this.hasPermission("ticket:edit")) return true;
    return ticket.asignado_id === user?.id || ticket.autor_id === user?.id;
  }

  openCreateTicket() {
    if (this.hasPermission("ticket:add") || this.hasPermission("ticket:create")) {
      this.showCreateModal = true;
      this.cdr.detectChanges();
    }
  }

  async closeCreateTicket() {
    this.showCreateModal = false;
    await this.loadTickets();
    this.cdr.detectChanges();
  }

  openMembersModal() {
    if (this.hasPermission("group:members") || this.hasPermission("group:edit")) {
      this.showMembersModal = true;
      this.cdr.detectChanges();
    }
  }

  closeMembersModal() {
    this.showMembersModal = false;
    this.cdr.detectChanges();
  }

  openTicketDetail(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  async closeTicketDetail() {
    this.showDetailModal = false;
    this.selectedTicket = null;
    await this.loadTickets();
    this.cdr.detectChanges();
  }

  async onTicketStatusChange(event: { ticket: Ticket; newStatus: string }) {
    if (!this.canEditTicket(event.ticket)) {
      this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'Solo el autor o el asignado pueden mover este ticket' });
      await this.loadTickets();
      return;
    }

    try {
      await this.ticketService.update(event.ticket.id, { estado_id: event.newStatus });
      await this.loadTickets();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
    }
  }

  async onTicketDelete(ticket: Ticket) {
    if (!this.canEditTicket(ticket)) {
      this.messageService.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'No tienes permiso para eliminar este ticket' });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este ticket?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.ticketService.delete(ticket.id);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket eliminado correctamente' });
          await this.loadTickets();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ticket' });
        }
      }
    });
  }

  goBack() {
    this.location.back();
  }
}