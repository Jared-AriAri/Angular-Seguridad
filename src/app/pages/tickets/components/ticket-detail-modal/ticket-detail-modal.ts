import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';

import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TagModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    DatePickerModule
  ],
  templateUrl: './ticket-detail-modal.html'
})
export class TicketDetailModalComponent implements OnChanges {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() ticket: any = null;
  @Input() canEdit = false; // Agregado para resolver el error del template

  @Output() closeModal = new EventEmitter<void>();

  editableTicket: any = null;
  newComment = '';
  canEditTicket = false;
  currentUserId = '';

  statusOptions: { label: string; value: string }[] = [];
  priorityOptions: { label: string; value: string }[] = [];
  assignedOptions: { label: string; value: string }[] = [];

  comentarios: any[] = [];
  historial: any[] = [];

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && this.ticket) {
      this.editableTicket = { ...this.ticket };

      if (this.editableTicket.fecha_final) {
        this.editableTicket.fecha_final = new Date(this.editableTicket.fecha_final);
      }

      this.currentUserId = this.authService.getCurrentUser()?.id || '';

      await this.loadLookups();
      await this.loadRelatedData();

      // Prioriza el input canEdit si viene del padre, de lo contrario evalúa permisos
      this.canEditTicket = this.canEdit || this.canUserEdit(this.ticket);
      this.cdr.detectChanges();
    }
  }

  private async loadLookups() {
    this.apiService.getStates().subscribe((res: any) => {
      const data = res?.data || res || [];
      this.statusOptions = data.map((e: any) => ({ label: e.nombre, value: e.id }));
    });

    this.ticketService.getPriorities().subscribe((res: any) => {
      const data = res?.data || res || [];
      this.priorityOptions = data.map((p: any) => ({ label: p.nombre, value: p.id }));
    });

    const resUsers: any = await this.userService.getAll();
    const usuarios = resUsers?.data || resUsers || [];
    this.assignedOptions = usuarios.map((u: any) => ({
      label: u.nombre_completo || u.username,
      value: u.id
    }));
    this.assignedOptions.unshift({ label: 'Sin asignar', value: '' });
  }

  private async loadRelatedData() {
    if (!this.ticket?.id) return;

    this.ticketService.getComments(this.ticket.id).subscribe((res: any) => {
      this.comentarios = res?.data || res || [];
    });

    this.ticketService.getHistory(this.ticket.id).subscribe((res: any) => {
      this.historial = res?.data || res || [];
    });
  }

  private canUserEdit(ticket: any) {
    if (!ticket) return false;
    if (this.authService.hasPermission("ticket:edit" as any)) return true;

    return (
      this.authService.hasPermission("ticket:comment" as any) &&
      (ticket.asignado_id === this.currentUserId || ticket.autor_id === this.currentUserId)
    );
  }

  private toISODate(value: Date | string | null) {
    if (!value) return null;
    if (typeof value === 'string') return value.split('T')[0];
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  close(): void {
    this.visible = false;
    this.closeModal.emit();
  }

  async save() {
    if (!this.editableTicket || !this.canEditTicket) return;

    const payload = {
      titulo: this.editableTicket.titulo,
      descripcion: this.editableTicket.descripcion,
      prioridad_id: this.editableTicket.prioridad_id,
      estado_id: this.editableTicket.estado_id,
      asignado_id: this.editableTicket.asignado_id || null,
      fecha_final: this.toISODate(this.editableTicket.fecha_final)
    };

    try {
      await this.ticketService.update(this.editableTicket.id, payload);
      this.close();
    } catch (e) {
      console.error(e);
    }
  }

  async addComment() {
    if (!this.newComment.trim() || !this.editableTicket) return;

    const commentPayload = {
      ticket_id: this.editableTicket.id,
      autor_id: this.currentUserId,
      contenido: this.newComment.trim()
    };

    try {
      await this.ticketService.addComment(commentPayload);
      this.newComment = '';
      await this.loadRelatedData();
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }
}