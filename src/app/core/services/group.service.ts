import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom, map } from 'rxjs';
import type { Group } from '../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/group`;

  async getAll(): Promise<Group[]> {
    return await lastValueFrom(
      this.http.get<{ data: Group[] }>(this.URL).pipe(map(res => res.data || []))
    );
  }

  async getMyGroups(userId: string): Promise<Group[]> {
    return await lastValueFrom(
      this.http.get<{ data: Group[] }>(`${this.URL}/mine/${userId}`).pipe(map(res => res.data || []))
    );
  }

  async getById(id: string): Promise<Group> {
    return await lastValueFrom(
      this.http.get<{ data: Group }>(`${this.URL}/${id}`).pipe(map(res => res.data))
    );
  }

  async getMembers(groupId: string): Promise<any[]> {
    return await lastValueFrom(
      this.http.get<{ data: any[] }>(`${this.URL}/${groupId}/members`).pipe(map(res => res.data || []))
    );
  }

  async addMember(groupId: string, usuarioId: string): Promise<any> {
    return await lastValueFrom(
      this.http.post<{ data: any }>(`${this.URL}/${groupId}/members`, { usuarioId })
        .pipe(map(res => res.data))
    );
  }

  async removeMember(groupId: string, usuarioId: string): Promise<any> {
    return await lastValueFrom(
      this.http.delete(`${this.URL}/${groupId}/members/${usuarioId}`)
    );
  }

  async create(payload: Partial<Group>): Promise<Group> {
    return await lastValueFrom(
      this.http.post<{ data: Group }>(this.URL, payload).pipe(map(res => res.data))
    );
  }

  async update(id: string, payload: Partial<Group>): Promise<Group> {
    return await lastValueFrom(
      this.http.put<{ data: Group }>(`${this.URL}/${id}`, payload).pipe(map(res => res.data))
    );
  }

  async remove(id: string): Promise<void> {
    return await lastValueFrom(
      this.http.delete<void>(`${this.URL}/${id}`)
    );
  }
}