import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from "@angular/cdk/drag-drop";
import { AuthContextService } from "../../../../shared/auth-context.service";
import type { Ticket } from "../../ticket.model";

@Component({
  selector: "app-ticket-kanban",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, DragDropModule],
  templateUrl: "./ticket-kanban.html"
})
export class TicketKanbanComponent implements OnChanges {

  @Input() tickets: Ticket[] = [];

  @Output() statusChange = new EventEmitter<{ ticket: Ticket; newStatus: string }>();
  @Output() ticketClick = new EventEmitter<Ticket>();

  pending: Ticket[] = [];
  inProgress: Ticket[] = [];
  review: Ticket[] = [];
  done: Ticket[] = [];
  blocked: Ticket[] = [];

  constructor(private authContext: AuthContextService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["tickets"]) {
      this.buildColumns();
    }
  }

  buildColumns() {

    this.pending = [];
    this.inProgress = [];
    this.review = [];
    this.done = [];
    this.blocked = [];

    for (const ticket of this.tickets) {

      if (ticket.status === "pendiente" || ticket.status === "pending") {
        this.pending.push(ticket);
      }

      else if (ticket.status === "en_progreso" || ticket.status === "in_progress") {
        this.inProgress.push(ticket);
      }

      else if (ticket.status === "revision" || ticket.status === "review") {
        this.review.push(ticket);
      }

      else if (ticket.status === "finalizado" || ticket.status === "completed") {
        this.done.push(ticket);
      }

      else if (ticket.status === "bloqueado" || ticket.status === "blocked") {
        this.blocked.push(ticket);
      }
    }
  }

  isMyTicket(ticket: Ticket) {

    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return false;

    return (
      (ticket.assignedTo || "").trim().toLowerCase() ===
      currentUser.username.trim().toLowerCase()
    );
  }

  drop(event: CdkDragDrop<Ticket[]>, newStatus: string) {

    const ticket = event.previousContainer.data[event.previousIndex];

    if (!this.isMyTicket(ticket)) {
      return;
    }

    if (event.previousContainer === event.container) {

      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

    } else {

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      ticket.status = newStatus as any;

      this.statusChange.emit({ ticket, newStatus });
    }
  }

  onTicketClick(ticket: Ticket) {
    this.ticketClick.emit(ticket);
  }
}