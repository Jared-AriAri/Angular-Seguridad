import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { FormsModule } from "@angular/forms";
import type { Ticket } from "../../ticket.model";

@Component({
  selector: "app-ticket-list",
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, InputTextModule, SelectModule, FormsModule],
  templateUrl: "./ticket-list.html"
})
export class TicketListComponent {
  @Input() tickets: Ticket[] = [];
  @Output() ticketClick = new EventEmitter<Ticket>();

  statusOptions = [
    { label: "Todos", value: null },
    { label: "Pendiente", value: "pending" },
    { label: "En progreso", value: "in_progress" },
    { label: "Revisión", value: "review" },
    { label: "Finalizado", value: "completed" }
  ];

  onRowSelect(event: any) {
    this.ticketClick.emit(event.data);
  }
}