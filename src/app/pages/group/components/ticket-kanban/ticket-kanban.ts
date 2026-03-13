import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import type { Ticket } from "../../ticket.model";

@Component({
  selector: "app-ticket-kanban",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, DragDropModule],
  templateUrl: "./ticket-kanban.html"
})
export class TicketKanbanComponent {
  @Input() tickets: Ticket[] = [];
  @Output() statusChange = new EventEmitter<{ticket: Ticket, newStatus: string}>();
  @Output() ticketClick = new EventEmitter<Ticket>();

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

  drop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const ticket = event.container.data[event.currentIndex];
      ticket.status = newStatus as any;
      this.statusChange.emit({ ticket, newStatus });
    }
  }

  onTicketClick(ticket: Ticket) {
    this.ticketClick.emit(ticket);
  }
}