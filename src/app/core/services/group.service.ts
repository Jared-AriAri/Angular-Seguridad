import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';
import type { Group } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/group`;

  async getAll(): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.URL}/`));
  }

  async getMyGroups(userId: string): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.URL}/mine/${userId}`));
  }

  async getById(id: string): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.URL}/${id}`));
  }

  async getMembers(groupId: string): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.URL}/${groupId}/members`));
  }

  async addMember(groupId: string, usuarioId: string): Promise<any> {
    return await lastValueFrom(this.http.post(`${this.URL}/members`, { grupo_id: groupId, usuario_id: usuarioId }));
  }

  async removeMember(groupId: string, usuarioId: string): Promise<any> {
    return await lastValueFrom(this.http.delete(`${this.URL}/members/${groupId}/${usuarioId}`));
  }

  async create(payload: Partial<Group>): Promise<any> {
    return await lastValueFrom(this.http.post(`${this.URL}/`, payload));
  }

  async update(id: string, payload: Partial<Group>): Promise<any> {
    return await lastValueFrom(this.http.put(`${this.URL}/${id}`, payload));
  }

  async remove(id: string): Promise<any> {
    return await lastValueFrom(this.http.delete(`${this.URL}/${id}`));
  }
}