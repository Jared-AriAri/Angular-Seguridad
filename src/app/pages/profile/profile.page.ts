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
import type { UserItem, UserRole } from "../user/user.model";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TicketListComponent, TagModule, ButtonModule],
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
    this.user = this.authContext.getCurrentUser() as UserItem | null;
    if (!this.user) return;

    const allTickets = this.ticketService.getAll();
    this.tickets = this.filterTicketsForCurrentUser(allTickets);
  }

  get totalTickets() {
    return this.tickets.length;
  }

  get openTickets() {
    return this.tickets.filter((t) => t.status !== "finalizado").length;
  }

  get doneTickets() {
    return this.tickets.filter((t) => t.status === "finalizado").length;
  }

  get roleLabel() {
    if (!this.user?.role) return "Member";
    if (this.user.role === "superadmin") return "Superadmin";
    if (this.user.role === "admin") return "Admin";
    return "Member";
  }

  private filterTicketsForCurrentUser(tickets: Ticket[]) {
    if (!this.user) return [];

    const username = this.normalize(this.user.username);

    return tickets.filter((ticket) => {
      const assignedTo = this.normalize((ticket as any).assignedTo);
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
    return String(value ?? "")
      .trim()
      .toLowerCase();
  }

  close() {
    // Return to dashboard instead of closing modal
    window.history.back();
  }
}