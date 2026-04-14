import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/user`;

  async getAll(): Promise<any[]> {
    const res: any = await lastValueFrom(this.http.get(`${this.URL}/`));
    return res?.data || res || [];
  }

  async create(user: any): Promise<any> {
    const res: any = await lastValueFrom(this.http.post(`${this.URL}/`, user));
    return res?.data || res;
  }

  async update(id: string, user: any): Promise<any> {
    const res: any = await lastValueFrom(this.http.put(`${this.URL}/${id}`, user));
    return res?.data || res;
  }

  async remove(id: string): Promise<any> {
    return await lastValueFrom(this.http.delete(`${this.URL}/${id}`));
  }

  async updatePermissions(userId: string, permissions: string[]): Promise<any> {
    const res: any = await lastValueFrom(
      this.http.put(`${this.URL}/${userId}/permissions`, { permissions })
    );
    return res?.data || res;
  }
}