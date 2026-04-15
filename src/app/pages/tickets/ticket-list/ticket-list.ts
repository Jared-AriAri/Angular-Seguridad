import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import type { Ticket } from "../../../core/models/ticket.model";

@Component({
  selector: "app-ticket-list",
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    FormsModule
  ],
  templateUrl: "./ticket-list.html"
})
export class TicketListComponent {
  private authService = inject(AuthService);

  @Input() tickets: Ticket[] = [];
  @Output() ticketClick = new EventEmitter<Ticket>();

  statusOptions = [
    { label: "Pendiente", value: "Pendiente" },
    { label: "En progreso", value: "En progreso" },
    { label: "Revisión", value: "Revision" },
    { label: "Bloqueado", value: "Bloqueado" },
    { label: "Finalizado", value: "Finalizado" }
  ];

  onRowSelect(event: any) {
    // Permitimos que todos hagan clic para ver el detalle
    this.ticketClick.emit(event.data);
  }

  getStatusSeverity(status?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const s = status?.toLowerCase();
    if (s === "pendiente") return "warn";
    if (s === "en progreso") return "info";
    if (s === "revision") return "contrast";
    if (s === "finalizado") return "success";
    if (s === "bloqueado") return "danger";
    return "secondary";
  }

  getPrioritySeverity(priority?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const p = priority?.toLowerCase();
    if (p === "urgente" || p === "alta") return "danger";
    if (p === "media") return "warn";
    return "info";
  }

  isExpired(date?: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }
}