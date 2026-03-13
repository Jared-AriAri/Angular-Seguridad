import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import type { Ticket } from "../../ticket.model";

@Component({
  selector: "app-ticket-list",
  standalone: true,
  imports: [CommonModule, TableModule, TagModule],
  templateUrl: "./ticket-list.html"
})
export class TicketListComponent {
  @Input() tickets: Ticket[] = [];
}