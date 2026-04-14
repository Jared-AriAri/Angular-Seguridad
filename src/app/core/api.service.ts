import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient) { }

    getUsers() {
        return this.http.get<any[]>(`${environment.apiUrl}/user`);
    }

    getTickets() {
        return this.http.get<any[]>(`${environment.apiUrl}/ticket`);
    }

    getGroups() {
        return this.http.get<any[]>(`${environment.apiUrl}/group`);
    }

    getStates() {
        return this.http.get<any[]>(`${environment.apiUrl}/ticket/states`);
    }
}