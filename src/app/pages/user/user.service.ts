import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import type { UserItem, Permission } from "./user.model";
import {
  ALL_PERMISSIONS,
  MEMBER_DEFAULT_PERMISSIONS,
  ADMIN_DEFAULT_PERMISSIONS,
  normalizePermissions,
} from "./user.model";

const STORAGE_KEY = "demo_users";
const CURRENT_USER_KEYS = [
  "current_user",
  "auth_user",
  "session_user",
  "user",
  "logged_user",
] as const;

type UpsertPayload = Pick<
  UserItem,
  | "username"
  | "password"
  | "email"
  | "fullName"
  | "address"
  | "phone"
  | "birthDate"
> & {
  permissions?: Permission[];
};

@Injectable({ providedIn: "root" })
export class UserService {
  private subject = new BehaviorSubject<UserItem[]>(this.load());
  users$ = this.subject.asObservable();

  seedIfEmpty() {
    if (this.subject.value.length) return;

    const initial = this.getSystemUsers();
    this.persist(initial);
  }

  ensureSystemUsers() {
    const list = [...this.subject.value];
    const merged = this.mergeMissingSystemUsers(list);
    this.persist(merged);
  }

  getAll() {
    return [...this.subject.value];
  }

  getByUsername(username: string): UserItem | null {
    return (
      this.subject.value.find(
        (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase()
      ) || null
    );
  }

  upsert(payload: UpsertPayload, username?: string) {
    const list = [...this.subject.value];
    const permissions = this.normalizePermissionInput(payload.permissions);

    if (username) {
      const idx = list.findIndex(
        (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase()
      );

      if (idx >= 0) {
        const previousUsername = list[idx].username;

        list[idx] = {
          ...list[idx],
          username: payload.username.trim(),
          password: payload.password,
          email: payload.email.trim().toLowerCase(),
          fullName: payload.fullName.trim(),
          address: payload.address.trim(),
          phone: payload.phone.trim(),
          birthDate: payload.birthDate.trim(),
          permissions,
        };

        this.persist(list, previousUsername);
        return list[idx];
      }
    }

    const created: UserItem = {
      username: payload.username.trim(),
      password: payload.password,
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName.trim(),
      address: payload.address.trim(),
      phone: payload.phone.trim(),
      birthDate: payload.birthDate.trim(),
      createdAt: new Date().toISOString(),
      permissions,
    };

    list.unshift(created);
    this.persist(list);

    return created;
  }

  remove(username: string) {
    const protectedUsers = ["superadmin", "admin", "member"];

    if (protectedUsers.includes(username.trim().toLowerCase())) {
      return;
    }

    const list = this.subject.value.filter(
      (u) => u.username.trim().toLowerCase() !== username.trim().toLowerCase()
    );

    this.persist(list, username);
  }

  private getSystemUsers(): UserItem[] {
    const now = new Date().toISOString();

    const superadmin: UserItem = {
      username: "superadmin",
      password: "SuperAdmin12345!",
      email: "superadmin@demo.com",
      fullName: "Super Administrador",
      address: "Sistema",
      phone: "0000000000",
      birthDate: "2000-01-01",
      createdAt: now,
      permissions: [...ALL_PERMISSIONS],
    };

    const admin: UserItem = {
      username: "admin",
      password: "Admin12345!",
      email: "admin@demo.com",
      fullName: "Administrador del sistema",
      address: "Sistema",
      phone: "0000000001",
      birthDate: "2000-01-01",
      createdAt: now,
      permissions: [...ADMIN_DEFAULT_PERMISSIONS],
    };

    const member: UserItem = {
      username: "member",
      password: "Member12345!",
      email: "member@demo.com",
      fullName: "Usuario miembro",
      address: "Sistema",
      phone: "0000000002",
      birthDate: "2000-01-01",
      createdAt: now,
      permissions: [...MEMBER_DEFAULT_PERMISSIONS],
    };

    return [superadmin, admin, member];
  }

  private mergeMissingSystemUsers(list: UserItem[]): UserItem[] {
    const systemUsers = this.getSystemUsers();
    const systemMap = new Map(
      systemUsers.map((u) => [u.username.trim().toLowerCase(), u])
    );

    const merged = list.map((user) => {
      const key = user.username.trim().toLowerCase();
      const systemUser = systemMap.get(key);

      if (!systemUser) {
        return user;
      }

      return {
        ...user,
        password: systemUser.password,
        email: systemUser.email,
        fullName: systemUser.fullName,
        address: systemUser.address,
        phone: systemUser.phone,
        birthDate: systemUser.birthDate,
        permissions: [...systemUser.permissions],
      };
    });

    const existingUsernames = new Set(
      merged.map((u) => u.username.trim().toLowerCase())
    );

    const missing = systemUsers.filter(
      (u) => !existingUsernames.has(u.username.trim().toLowerCase())
    );

    return [...merged, ...missing];
  }

  private normalizePermissionInput(
    permissions: Permission[] | undefined
  ): Permission[] {
    if (!permissions?.length) {
      return [...MEMBER_DEFAULT_PERMISSIONS];
    }

    const normalized = normalizePermissions({ permissions });

    return normalized.length ? normalized : [...MEMBER_DEFAULT_PERMISSIONS];
  }

  private persist(list: UserItem[], previousUsername?: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.syncCurrentSessionUsers(list, previousUsername);
    this.subject.next(list);
  }

  private load(): UserItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const users = raw ? (JSON.parse(raw) as UserItem[]) : [];

      const normalized = users.map((user: any) => ({
        ...user,
        permissions: normalizePermissions(user),
      }));

      const merged = this.mergeMissingSystemUsers(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      this.syncCurrentSessionUsers(merged);

      return merged;
    } catch {
      const initial = this.getSystemUsers();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      this.syncCurrentSessionUsers(initial);
      return initial;
    }
  }

  private syncCurrentSessionUsers(list: UserItem[], previousUsername?: string) {
    for (const key of CURRENT_USER_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const current = JSON.parse(raw);
        const currentUsername = String(current?.username ?? "")
          .trim()
          .toLowerCase();

        if (!currentUsername) continue;

        const updated =
          list.find(
            (u) =>
              u.username.trim().toLowerCase() ===
              (previousUsername
                ? previousUsername.trim().toLowerCase()
                : currentUsername)
          ) ||
          list.find(
            (u) => u.username.trim().toLowerCase() === currentUsername
          );

        if (updated) {
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch { }
    }
  }
}