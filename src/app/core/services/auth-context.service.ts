import { Injectable, inject } from "@angular/core";
import { AuthService } from "./auth.service";
import type { Permission, UserItem } from "../models/user.model";

@Injectable({
  providedIn: "root",
})
export class AuthContextService {
  private authService = inject(AuthService);

  getCurrentUser(): UserItem | null {
    return this.authService.getCurrentUser();
  }

  getCurrentPermissions(): Permission[] {
    const user = this.getCurrentUser();
    return user?.permissions || [];
  }

  hasPermission(permission: Permission): boolean {
    return this.authService.hasPermission(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    const userPermissions = this.getCurrentPermissions();
    return permissions.some(
      (p) => userPermissions.includes(p) || userPermissions.includes("admin" as any)
    );
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    const userPermissions = this.getCurrentPermissions();
    return permissions.every(
      (p) => userPermissions.includes(p) || userPermissions.includes("admin" as any)
    );
  }

  isMyTicket(assignedId: string | null | undefined): boolean {
    const currentUser = this.getCurrentUser() as any;
    if (!currentUser || !assignedId) return false;

    return assignedId === currentUser.id;
  }

  isLogged(): boolean {
    return this.getCurrentUser() !== null;
  }
}
