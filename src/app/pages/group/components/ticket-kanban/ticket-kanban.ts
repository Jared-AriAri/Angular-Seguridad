import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import type { Ticket } from "../../ticket.model";

@Component({
  selector: "app-ticket-kanban",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: "./ticket-kanban.html"
})
export class TicketKanbanComponent {
  @Input() tickets: Ticket[] = [];

  get pending() {
    return this.tickets.filter((ticket) => ticket.status === "pendiente");
  }

  get inProgress() {
    return this.tickets.filter((ticket) => ticket.status === "en_progreso");
  }

  get review() {
    return this.tickets.filter((ticket) => ticket.status === "revision");
  }

  get done() {
    return this.tickets.filter((ticket) => ticket.status === "finalizado");
  }
}