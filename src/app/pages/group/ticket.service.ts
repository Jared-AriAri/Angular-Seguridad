import { Injectable } from "@angular/core";
import type { Ticket, TicketStatus } from "./ticket.model";

@Injectable({
  providedIn: "root",
})
export class TicketService {
  private readonly storageKey = "tickets";

  seedIfEmpty() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) return;
    localStorage.setItem(this.storageKey, JSON.stringify([]));
  }

  getAll(): Ticket[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  getByGroup(groupId: string): Ticket[] {
    return this.getAll().filter((ticket) => ticket.groupId === groupId);
  }

  getByStatus(status: TicketStatus, groupId?: string): Ticket[] {
    const source = groupId ? this.getByGroup(groupId) : this.getAll();
    return source.filter((ticket) => ticket.status === status);
  }

  create(ticket: Ticket) {
    const tickets = this.getAll();
    tickets.push(ticket);
    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
  }

  update(updatedTicket: Ticket) {
    const tickets = this.getAll().map((ticket) =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
  }

  remove(id: string) {
    const tickets = this.getAll().filter((ticket) => ticket.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
  }
}