import { Injectable } from "@angular/core";
import type { Permission, UserItem } from "../pages/user/user.model";
import { normalizePermissions } from "../pages/user/user.model";

const USERS_STORAGE_KEY = "demo_users";

@Injectable({
  providedIn: "root",
})
export class AuthContextService {
  getUsers(): UserItem[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      const users = raw ? (JSON.parse(raw) as UserItem[]) : [];

      return users.map((user: any) => ({
        ...user,
        permissions: normalizePermissions(user),
      }));
    } catch {
      return [];
    }
  }

  getCurrentUsername(): string | null {
    const directKeys = [
      "currentUsername",
      "username",
      "loggedUsername",
    ];

    for (const key of directKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value.trim();
    }

    const jsonKeys = [
      "currentUser",
      "user",
      "sessionUser",
      "current_user",
      "auth_user",
      "session_user",
      "logged_user",
    ];

    for (const key of jsonKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed?.username) return String(parsed.username).trim();
      } catch { }
    }

    return null;
  }

  getCurrentUser(): UserItem | null {
    const username = this.getCurrentUsername();
    if (!username) return null;

    const users = this.getUsers();

    return (
      users.find(
        (user) =>
          user.username.trim().toLowerCase() ===
          username.trim().toLowerCase()
      ) || null
    );
  }

  getCurrentPermissions(): Permission[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    return normalizePermissions(user);
  }

  hasPermission(permission: Permission): boolean {
    const permissions = this.getCurrentPermissions();
    return permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    const userPermissions = this.getCurrentPermissions();

    return permissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    const userPermissions = this.getCurrentPermissions();

    return permissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  isMyTicket(assignedTo: string | null | undefined): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    return (
      (assignedTo || "").trim().toLowerCase() ===
      currentUser.username.trim().toLowerCase()
    );
  }

  isLogged(): boolean {
    return this.getCurrentUser() !== null;
  }
}