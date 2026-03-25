import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { AuthContextService } from "../../shared/auth-context.service";
import { TicketService } from "../group/ticket.service";
import type { Ticket } from "../group/ticket.model";
import { TicketListComponent } from "../group/components/ticket-list/ticket-list";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import type { UserItem } from "../user/user.model";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TicketListComponent,
    TagModule,
    ButtonModule,
  ],
  templateUrl: "./profile.page.html",
})
export class ProfilePage implements OnInit {
  user: UserItem | null = null;
  tickets: Ticket[] = [];

  constructor(
    private authContext: AuthContextService,
    private ticketService: TicketService
  ) { }

  ngOnInit() {
    this.user = this.authContext.getCurrentUser();
    if (!this.user) return;

    const allTickets = this.ticketService.getAll();
    this.tickets = this.filterTicketsForCurrentUser(allTickets);
  }

  get totalTickets() {
    return this.tickets.length;
  }

  get openTickets() {
    return this.tickets.filter(
      (t) =>
        t.status !== "finalizado" &&
        t.status !== "completed"
    ).length;
  }

  get doneTickets() {
    return this.tickets.filter(
      (t) =>
        t.status === "finalizado" ||
        t.status === "completed"
    ).length;
  }

  get permissionLevelLabel() {
    if (!this.user) return "Sin acceso";

    const count = this.user.permissions.length;

    if (count === 0) return "Sin acceso";
    if (count > 14) return "Acceso alto";
    if (count > 6) return "Acceso medio";
    return "Acceso básico";
  }

  private filterTicketsForCurrentUser(tickets: Ticket[]) {
    if (!this.user) return [];

    const username = this.normalize(this.user.username);

    return tickets.filter((ticket) => {
      const assignedTo = this.normalize(ticket.assignedTo);
      const createdBy = this.normalize((ticket as any).createdBy);
      const usernameField = this.normalize((ticket as any).username);

      return (
        assignedTo === username ||
        createdBy === username ||
        usernameField === username
      );
    });
  }

  private normalize(value: unknown) {
    return String(value ?? "").trim().toLowerCase();
  }

  close() {
    window.history.back();
  }
}