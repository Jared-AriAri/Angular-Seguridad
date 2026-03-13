import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { Ticket } from '../../ticket.model';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, TagModule],
  templateUrl: './ticket-detail-modal.html'
})
export class TicketDetailModalComponent {
  @Input() visible = false;
  @Input() ticket: Ticket | null = null;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }
}