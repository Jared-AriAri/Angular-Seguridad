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
      return;
    }

    this.tickets = this.ticketService.getByGroup(this.groupId);
  }

  openCreateTicket() {
    if (!this.hasPermission("ticket:create")) return;
    this.showCreateModal = true;
  }

  closeCreateTicket() {
    this.showCreateModal = false;
    this.loadTickets();
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

  backToGroups() {
    this.router.navigate(["/app/group"]);
  }
}