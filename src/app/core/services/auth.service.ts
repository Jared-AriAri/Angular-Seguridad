import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserItem, Permission, normalizePermissions } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly URL = `${environment.apiUrl}/auth`;
    private http = inject(HttpClient);

    private currentUserSubject = new BehaviorSubject<UserItem | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    private initializedSubject = new BehaviorSubject<boolean>(false);
    initialized$ = this.initializedSubject.asObservable();

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const token = localStorage.getItem('session_token');
        if (token) {
            try {
                await this.refreshUserData();
            } catch (e) {
                this.clearAuthData();
            }
        }
        this.initializedSubject.next(true);
    }

    private async refreshUserData(): Promise<UserItem | null> {
        try {
            const user = await lastValueFrom(this.http.get<UserItem>(`${this.URL}/me`));
            if (user) {
                user.permissions = normalizePermissions(user);
                this.currentUserSubject.next(user);
                return user;
            }
            return null;
        } catch (e) {
            console.error('❌ Error refrescando datos de usuario:', e);
            return null;
        }
    }

    async login(credentials: { email: string, password: string }) {
        try {
            // 1. Llamamos al login
            const response = await lastValueFrom(
                this.http.post<{ user: UserItem, token: string }>(`${this.URL}/login`, credentials)
            );

            // 2. Si hay token, lo guardamos inmediatamente
            if (response && response.token) {
                localStorage.setItem('session_token', response.token);

                // 3. Cargamos los datos extendidos del usuario (/me)
                const fullUser = await this.refreshUserData();

                // 4. IMPORTANTE: Devolvemos la respuesta original que TIENE el token
                // para que el LoginComponent no de error
                return response;
            }
            return null;
        } catch (e) {
            throw e;
        }
    }

    async logout() {
        try {
            await lastValueFrom(this.http.post(`${this.URL}/logout`, {}));
        } catch (e) {
            console.warn('Error en logout de servidor, limpiando local igual...');
        } finally {
            this.clearAuthData();
        }
    }

    private clearAuthData() {
        this.currentUserSubject.next(null);
        localStorage.removeItem('session_token');
        // Opcional: limpiar toda la basura vieja
        localStorage.removeItem('token');
    }

    getCurrentUser(): UserItem | null {
        return this.currentUserSubject.value;
    }

    hasPermission(perm: Permission): boolean {
        const user = this.currentUserSubject.value;
        if (!user) return false;
        const perms = user.permissions || [];
        return perms.includes("admin") || perms.includes(perm);
    }

    async register(data: any): Promise<any> {
        return await lastValueFrom(this.http.post(`${this.URL}/register`, data));
    }
}