import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom, Observable, map } from 'rxjs';
import { Ticket } from '../models/ticket.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly URL = `${environment.apiUrl}/ticket`;
  private http = inject(HttpClient);

  async getAll(): Promise<Ticket[]> {
    return await lastValueFrom(
      this.http.get<{ data: Ticket[] }>(this.URL).pipe(map(res => res.data || []))
    );
  }

  async getById(id: string): Promise<Ticket> {
    return await lastValueFrom(
      this.http.get<{ data: Ticket }>(`${this.URL}/${id}`).pipe(map(res => res.data))
    );
  }

  async getByGroup(grupoId: string): Promise<Ticket[]> {
    const params = new HttpParams()
      .set('grupo_id', grupoId)
      .set('t', new Date().getTime().toString());

    return await lastValueFrom(
      this.http.get<{ data: Ticket[] }>(this.URL, { params }).pipe(map(res => res.data || []))
    );
  }

  getPriorities(): Observable<any[]> {
    return this.http.get<{ data: any[] }>(`${this.URL}/priorities`).pipe(map(res => res.data || []));
  }

  getComments(ticketId: string): Observable<any[]> {
    return this.http.get<{ data: any[] }>(`${this.URL}/${ticketId}/comments`).pipe(map(res => res.data || []));
  }

  getHistory(ticketId: string): Observable<any[]> {
    return this.http.get<{ data: any[] }>(`${this.URL}/${ticketId}/history`).pipe(map(res => res.data || []));
  }

  async create(ticket: Partial<Ticket>): Promise<Ticket> {
    return await lastValueFrom(
      this.http.post<{ data: Ticket }>(this.URL, ticket).pipe(map(res => res.data))
    );
  }

  async update(id: string, updatedTicket: Partial<Ticket>): Promise<Ticket> {
    return await lastValueFrom(
      this.http.put<{ data: Ticket }>(`${this.URL}/${id}`, updatedTicket).pipe(map(res => res.data))
    );
  }

  async delete(id: string): Promise<void> {
    return await lastValueFrom(this.http.delete<void>(`${this.URL}/${id}`));
  }

  async addComment(payload: { ticket_id: string; autor_id: string; contenido: string }): Promise<any> {
    return await lastValueFrom(
      this.http.post<{ data: any }>(`${this.URL}/comments`, payload).pipe(map(res => res.data))
    );
  }
}