import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { Ticket, TicketPriority, TicketStatus } from '../../ticket.model';
import { TicketService } from '../../ticket.service';
import { AuthContextService } from '../../../../shared/auth-context.service';

type StoredUser = { username: string; fullName: string; };

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, TagModule,
    SelectModule, InputTextModule, TextareaModule, ButtonModule
  ],
  templateUrl: './ticket-detail-modal.html'
})
export class TicketDetailModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() ticket: Ticket | null = null;
  @Input() canEdit = false;
  @Output() closeModal = new EventEmitter<void>();

  editableTicket: Ticket | null = null;
  newComment = "";
  
  statusOptions = [
    { label: "Pendiente", value: "pendiente" },
    { label: "En progreso", value: "en_progreso" },
    { label: "Revisión", value: "revision" },
    { label: "Finalizado", value: "finalizado" }
  ];

  priorityOptions = [
    { label: "Highest (最高)", value: "最高" },
    { label: "High (高)", value: "高" },
    { label: "Medium High (中高)", value: "中高" },
    { label: "Medium (中)", value: "中" },
    { label: "Medium Low (中低)", value: "中低" },
    { label: "Low (低)", value: "低" },
    { label: "Lowest (最低)", value: "最低" }
  ];

  assignedOptions: { label: string; value: string }[] = [];

  constructor(
    private ticketService: TicketService,
    private authContext: AuthContextService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && this.ticket) {
      // Create a deep copy to allow canceling without affecting the original object
      this.editableTicket = JSON.parse(JSON.stringify(this.ticket));
      this.loadUsers();
    }
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem("demo_users");
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];
      this.assignedOptions = users.map((user) => ({
        label: user.fullName?.trim() || user.username,
        value: user.username
      }));
    } catch {
      this.assignedOptions = [];
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  save(): void {
    if (!this.editableTicket) return;
    
    // Add history item if something changed
    const currentUser = this.authContext.getCurrentUser()?.username || 'Unknown';
    if (this.ticket && this.editableTicket.status !== this.ticket.status) {
      this.editableTicket.history = this.editableTicket.history || [];
      this.editableTicket.history.push({
        id: crypto.randomUUID(),
        action: `Cambió estado a ${this.editableTicket.status}`,
        user: currentUser,
        createdAt: new Date().toISOString()
      });
    }

    this.ticketService.update(this.editableTicket);
    this.close();
  }

  addComment() {
    if (!this.newComment.trim() || !this.editableTicket) return;
    
    const currentUser = this.authContext.getCurrentUser()?.username || 'Unknown';
    this.editableTicket.comments = this.editableTicket.comments || [];
    
    this.editableTicket.comments.push({
      id: crypto.randomUUID(),
      author: currentUser,
      message: this.newComment.trim(),
      createdAt: new Date().toISOString()
    });
    
    this.newComment = "";
    // Save directly to persist comment
    this.ticketService.update(this.editableTicket);
  }
}