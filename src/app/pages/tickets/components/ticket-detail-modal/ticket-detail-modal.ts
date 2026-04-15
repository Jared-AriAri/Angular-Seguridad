import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

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
    DatePickerModule,
    ToastModule
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
  @Input() canEdit = false;

  @Output() closeModal = new EventEmitter<void>();

  editableTicket: any = null;
  newComment = '';
  canEditTicket = false;
  currentUserId = '';
  loading = false;

  statusOptions: any[] = [];
  priorityOptions: any[] = [];
  assignedOptions: any[] = [];
  comentarios: any[] = [];
  historial: any[] = [];

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && this.ticket) {
      await this.initModal();
    }
  }

  private async initModal() {
    this.loading = true;
    this.cdr.detectChanges();

    this.editableTicket = { ...this.ticket };
    if (this.editableTicket.fecha_final) {
      this.editableTicket.fecha_final = new Date(this.editableTicket.fecha_final);
    }

    this.currentUserId = this.authService.getCurrentUser()?.id || '';
    this.canEditTicket = this.canEdit || this.canUserEdit(this.ticket);

    try {
      await Promise.all([
        this.loadStatusOptions(),
        this.loadPriorityOptions(),
        this.loadUserOptions(),
        this.loadComments(),
        this.loadHistory()
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadStatusOptions() {
    if (this.statusOptions.length > 0) return;
    const res: any = await lastValueFrom(this.apiService.getStates());
    const data = res?.data || res || [];
    this.statusOptions = data.map((e: any) => ({ label: e.nombre, value: e.id }));
  }

  private async loadPriorityOptions() {
    if (this.priorityOptions.length > 0) return;
    const res: any = await lastValueFrom(this.ticketService.getPriorities());
    const data = res?.data || res || [];
    this.priorityOptions = data.map((p: any) => ({ label: p.nombre, value: p.id }));
  }

  private async loadUserOptions() {
    if (this.assignedOptions.length > 1) return;
    const res: any = await this.userService.getAll();
    const usuarios = res?.data || res || [];
    this.assignedOptions = usuarios.map((u: any) => ({
      label: u.nombre_completo || u.username,
      value: u.id
    }));
    this.assignedOptions.unshift({ label: 'Sin asignar', value: '' });
  }

  private async loadComments() {
    const res: any = await lastValueFrom(this.ticketService.getComments(this.ticket.id));
    this.comentarios = res?.data || res || [];
  }

  private async loadHistory() {
    const res: any = await lastValueFrom(this.ticketService.getHistory(this.ticket.id));
    this.historial = res?.data || res || [];
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
      await this.loadComments();
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }
}