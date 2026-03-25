import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Ticket, TicketPriority, TicketStatus } from '../../ticket.model';
import { TicketService } from '../../ticket.service';
import { AuthContextService } from '../../../../shared/auth-context.service';
import { normalizePermissions } from "../../../user/user.model";

type StoredUser = {
  username: string;
  fullName: string;
  permissions?: string[];
};

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

  @Input() visible = false;
  @Input() ticket: Ticket | null = null;
  @Input() canEdit = false;

  @Output() closeModal = new EventEmitter<void>();

  editableTicket: Ticket | null = null;
  newComment = '';
  canEditTicket = false;

  statusOptions = [
    { label: 'Pending', value: 'pending' as TicketStatus },
    { label: 'In Progress', value: 'in_progress' as TicketStatus },
    { label: 'Review', value: 'review' as TicketStatus },
    { label: 'Completed', value: 'completed' as TicketStatus },
    { label: 'Blocked', value: 'blocked' as TicketStatus }
  ];

  priorityOptions = [
    { label: 'Highest', value: 'highest' as TicketPriority },
    { label: 'High', value: 'high' as TicketPriority },
    { label: 'Medium High', value: 'medium_high' as TicketPriority },
    { label: 'Medium', value: 'medium' as TicketPriority },
    { label: 'Medium Low', value: 'medium_low' as TicketPriority },
    { label: 'Low', value: 'low' as TicketPriority },
    { label: 'Lowest', value: 'lowest' as TicketPriority }
  ];

  assignedOptions: { label: string; value: string }[] = [];

  constructor(
    private ticketService: TicketService,
    private authContext: AuthContextService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && this.ticket) {
      this.editableTicket = JSON.parse(JSON.stringify(this.ticket));
      this.loadUsers();
      this.canEditTicket = this.canUserEdit(this.ticket);
    }
  }

  private canUserEdit(ticket: Ticket | null) {
    if (!ticket) return false;
    if (this.authContext.hasPermission("ticket:edit")) return true;

    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return false;

    return (
      this.authContext.hasPermission("ticket:comment") &&
      (ticket.assignedTo || "").trim().toLowerCase() ===
      currentUser.username.trim().toLowerCase()
    );
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem('demo_users');
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];

      const allowedUsers = users.filter(user => {
        const permissions = normalizePermissions(user);
        return permissions.length > 14;
      });

      this.assignedOptions = allowedUsers.map(user => ({
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
    if (!this.canEditTicket) return;

    const currentUser = this.authContext.getCurrentUser()?.username || 'Unknown';

    if (this.ticket && this.editableTicket.status !== this.ticket.status) {
      this.editableTicket.history = this.editableTicket.history || [];
      this.editableTicket.history.push({
        id: crypto.randomUUID(),
        action: `Changed status to ${this.editableTicket.status}`,
        user: currentUser,
        createdAt: new Date().toISOString()
      });
    }

    this.ticketService.update(this.editableTicket);
    this.close();
  }

  addComment() {
    if (!this.newComment.trim() || !this.editableTicket) return;
    if (!this.canEditTicket) return;

    const currentUser = this.authContext.getCurrentUser()?.username || 'Unknown';

    this.editableTicket.comments = this.editableTicket.comments || [];

    this.editableTicket.comments.push({
      id: crypto.randomUUID(),
      author: currentUser,
      message: this.newComment.trim(),
      createdAt: new Date().toISOString()
    });

    this.newComment = '';

    this.ticketService.update(this.editableTicket);
  }
}