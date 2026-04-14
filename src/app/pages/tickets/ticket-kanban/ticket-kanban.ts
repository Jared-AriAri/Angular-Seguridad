import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from "@angular/cdk/drag-drop";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/api.service";
import type { Ticket } from "../../../core/models/ticket.model";

@Component({
  selector: "app-ticket-kanban",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, DragDropModule, ButtonModule],
  templateUrl: "./ticket-kanban.html"
})
export class TicketKanbanComponent implements OnInit, OnChanges {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  @Input() tickets: Ticket[] = [];
  @Output() statusChange = new EventEmitter<{ ticket: Ticket; newStatus: string }>();
  @Output() ticketClick = new EventEmitter<Ticket>();
  @Output() ticketEdit = new EventEmitter<Ticket>();
  @Output() ticketDelete = new EventEmitter<Ticket>();

  pending: Ticket[] = [];
  inProgress: Ticket[] = [];
  review: Ticket[] = [];
  done: Ticket[] = [];
  blocked: Ticket[] = [];

  private statesMap: Record<string, string> = {};
  private currentUserId: string = "";

  ngOnInit() {
    this.loadStates();
    this.currentUserId = this.authService.getCurrentUser()?.id || "";
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["tickets"]) {
      this.buildColumns();
    }
  }

  private normalizeStr(str?: string | null) {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  }

  private loadStates() {
    this.apiService.getStates().subscribe((res: any) => {
      const data = res?.data || res || [];
      if (data) {
        data.forEach((s: any) => {
          this.statesMap[this.normalizeStr(s.nombre)] = s.id;
        });
        this.buildColumns();
      }
    });
  }

  buildColumns() {
    this.pending = [];
    this.inProgress = [];
    this.review = [];
    this.done = [];
    this.blocked = [];

    for (const ticket of this.tickets) {
      const nombreEstado = this.normalizeStr(ticket.estados?.nombre);
      if (nombreEstado === "pendiente") this.pending.push(ticket);
      else if (nombreEstado === "en progreso") this.inProgress.push(ticket);
      else if (nombreEstado === "revision") this.review.push(ticket);
      else if (nombreEstado === "finalizado") this.done.push(ticket);
      else if (nombreEstado === "bloqueado") this.blocked.push(ticket);
    }
  }

  isMyTicket(ticket: Ticket) {
    if (this.authService.hasPermission("ticket:edit" as any)) return true;
    // Normalizado a autor_id según tu modelo
    return ticket.asignado_id === this.currentUserId || ticket.autor_id === this.currentUserId;
  }

  isOwner(ticket: Ticket) {
    if (this.authService.hasPermission("ticket:edit" as any)) return true;
    // Normalizado a autor_id según tu modelo
    return ticket.autor_id === this.currentUserId || ticket.asignado_id === this.currentUserId;
  }

  drop(event: CdkDragDrop<Ticket[]>, columnNombre: string) {
    const ticket = event.previousContainer.data[event.previousIndex];

    if (!this.isMyTicket(ticket)) {
      console.warn("No tienes permiso para mover este ticket");
      return;
    }

    const newStatusId = this.statesMap[this.normalizeStr(columnNombre)];
    if (!newStatusId) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      ticket.estado_id = newStatusId;

      if (ticket.estados) {
        ticket.estados.nombre = columnNombre as any;
      }

      this.statusChange.emit({ ticket, newStatus: newStatusId });
    }
  }

  onTicketClick(ticket: Ticket) {
    this.ticketClick.emit(ticket);
  }

  editTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    this.ticketEdit.emit(ticket);
  }

  deleteTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    this.ticketDelete.emit(ticket);
  }

  getPrioritySeverity(ticket: Ticket): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const p = ticket.prioridades?.nombre;
    if (p === 'Urgente' || p === 'Alta') return 'danger';
    if (p === 'Media') return 'warn';
    return 'info';
  }

  getStatusSeverity(ticket: Ticket): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const s = this.normalizeStr(ticket.estados?.nombre);
    if (s === 'pendiente') return 'warn';
    if (s === 'en progreso') return 'info';
    if (s === 'revision') return 'contrast';
    if (s === 'finalizado') return 'success';
    if (s === 'bloqueado') return 'danger';
    return 'secondary';
  }
}