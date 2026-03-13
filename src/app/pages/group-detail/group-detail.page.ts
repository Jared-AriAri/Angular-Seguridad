import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { SelectButtonModule } from "primeng/selectbutton";

import { GroupService } from "../group/group.service";
import { TicketService } from "../group/ticket.service";
import { AuthContextService } from "../../shared/auth-context.service";

import type { Group } from "../group/group.model";
import type { Ticket } from "../group/ticket.model";
import type { Permission } from "../user/user.model";

import { TicketKanbanComponent } from "../group/components/ticket-kanban/ticket-kanban";
import { TicketListComponent } from "../group/components/ticket-list/ticket-list";
import { CreateTicketModalComponent } from "../group/components/create-ticket-modal/create-ticket-modal";
import { TicketDetailModalComponent } from "../group/components/ticket-detail-modal/ticket-detail-modal";
import { GroupMembersModalComponent } from "../group/components/group-members-modal/group-members-modal";

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
    TicketKanbanComponent,
    TicketListComponent,
    CreateTicketModalComponent,
    TicketDetailModalComponent,
    GroupMembersModalComponent
  ],
  templateUrl: "./group-detail.page.html"
})
export class GroupDetailPage implements OnInit {
  group: Group | null = null;
  tickets: Ticket[] = [];
  viewMode: "kanban" | "list" = "kanban";

  viewOptions = [
    { label: "Kanban", value: "kanban" },
    { label: "Lista", value: "list" }
  ];

  showCreateModal = false;
  showDetailModal = false;
  showMembersModal = false;

  selectedTicket: Ticket | null = null;
  private groupId = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private ticketService: TicketService,
    private authContext: AuthContextService
  ) {}

  ngOnInit() {
    if (!this.hasPermission("group:view")) {
      this.router.navigate(["/app/home"]);
      return;
    }

    this.groupService.seedIfEmpty();
    this.ticketService.seedIfEmpty();

    this.groupId = this.route.snapshot.paramMap.get("id") || "";
    this.loadGroup();
    this.loadTickets();
  }

  hasPermission(permission: Permission) {
    return this.authContext.hasPermission(permission);
  }

  hasAnyPermission(permissions: Permission[]) {
    return this.authContext.hasAnyPermission(permissions);
  }

  loadGroup() {
    const found = this.groupService.getById(this.groupId);
    if (!found) {
      this.router.navigate(["/app/group"]);
      return;
    }
    this.group = found;
  }

  loadTickets() {
    if (!this.hasPermission("ticket:view")) {
      this.tickets = [];
      this.filteredTickets = [];
      return;
    }

    this.tickets = this.ticketService.getByGroup(this.groupId);
    if (this.currentFilter) {
       this.applyFilter(this.currentFilter);
    } else {
       this.filteredTickets = [...this.tickets];
    }
  }

  filteredTickets: Ticket[] = [];
  currentFilter: 'all' | 'mine' | 'unassigned' | 'high_priority' = 'all';

  get totalTickets() { return this.tickets.length; }
  get pendingTickets() { return this.tickets.filter(t => t.status === 'pendiente' || t.status === 'en_progreso').length; }
  get completedTickets() { return this.tickets.filter(t => t.status === 'finalizado').length; }

  openCreateTicket() {
    if (!this.hasPermission("ticket:create")) return;
    this.showCreateModal = true;
  }

  closeCreateTicket() {
    this.showCreateModal = false;
    this.loadTickets();
    this.applyFilter(this.currentFilter);
  }

  openMembersModal() {
    if (!this.hasPermission("group:members")) return;
    this.showMembersModal = true;
  }

  closeMembersModal() {
    this.showMembersModal = false;
  }

  openTicketDetail(ticket: Ticket) {
    if (!this.hasPermission("ticket:view")) return;
    this.selectedTicket = ticket;
    this.showDetailModal = true;
  }

  closeTicketDetail() {
    this.showDetailModal = false;
    this.selectedTicket = null;
    this.loadTickets();
    this.applyFilter(this.currentFilter);
  }

  canEditTicket(ticket: Ticket) {
    if (this.hasPermission("ticket:edit")) return true;

    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return false;

    return (
      this.hasPermission("ticket:comment") &&
      (ticket.assignedTo || "").trim().toLowerCase() ===
        currentUser.username.trim().toLowerCase()
    );
  }

  applyFilter(filterType: 'all' | 'mine' | 'unassigned' | 'high_priority') {
    this.currentFilter = filterType;
    const currentUser = this.authContext.getCurrentUser();

    if (filterType === 'all') {
      this.filteredTickets = [...this.tickets];
    } else if (filterType === 'mine') {
      this.filteredTickets = this.tickets.filter(t => 
        (t.assignedTo || "").trim().toLowerCase() === (currentUser?.username || "").trim().toLowerCase()
      );
    } else if (filterType === 'unassigned') {
      this.filteredTickets = this.tickets.filter(t => !t.assignedTo || t.assignedTo.trim() === "");
    } else if (filterType === 'high_priority') {
      this.filteredTickets = this.tickets.filter(t => t.priority === '最高' || t.priority === '高' || t.priority === 'alta');
    }
  }

  onTicketStatusChange(event: {ticket: Ticket, newStatus: string}) {
    // Ticket status was already mapped to the ticket object by the Kanban component
    // we just need to persist it and reload
    this.ticketService.update(event.ticket);
    this.loadTickets();
    this.applyFilter(this.currentFilter);
  }

  backToGroups() {
    this.router.navigate(["/app/group"]);
  }
}