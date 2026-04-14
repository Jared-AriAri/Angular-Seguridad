import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import type { Ticket } from "../../../core/models/ticket.model";

@Component({
  selector: "app-ticket-list",
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, InputTextModule, SelectModule, FormsModule],
  templateUrl: "./ticket-list.html"
})
export class TicketListComponent {
  private authService = inject(AuthService);

  @Input() tickets: Ticket[] = [];
  @Output() ticketClick = new EventEmitter<Ticket>();

  today = new Date();

  statusOptions = [
    { label: "Todos", value: null },
    { label: "Pendiente", value: "Pendiente" },
    { label: "En Progreso", value: "En Progreso" },
    { label: "Revisión", value: "Revisión" },
    { label: "Finalizado", value: "Finalizado" },
    { label: "Bloqueado", value: "Bloqueado" }
  ];

  onRowSelect(event: any) {
    this.ticketClick.emit(event.data);
  }

  // Comprobar si el ticket me pertenece (Asignado o Creado)
  isMine(ticket: Ticket): boolean {
    const userId = this.authService.getCurrentUser()?.id;
    return ticket.asignado_id === userId || ticket.autor_id === userId;
  }

  isExpired(fecha: string | Date | null | undefined): boolean {
    if (!fecha) return false;
    const fechaFinal = new Date(fecha);
    return fechaFinal < this.today;
  }

  getStatusSeverity(status: string | undefined): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    if (!status) return "secondary";
    const s = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (s) {
      case "pendiente": return "warn";
      case "en progreso": return "info";
      case "revision": return "contrast";
      case "finalizado": return "success";
      case "bloqueado": return "danger";
      default: return "secondary";
    }
  }

  getPrioritySeverity(priority: string | undefined): "success" | "info" | "warn" | "danger" | "secondary" {
    if (!priority) return "secondary";
    const p = priority.toLowerCase();
    switch (p) {
      case "urgente":
      case "alta": return "danger";
      case "media": return "warn";
      case "baja": return "info";
      default: return "secondary";
    }
  }
}