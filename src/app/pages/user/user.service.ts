import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import type { UserItem, UserRole, Permission } from "./user.model";
import {
  normalizePermissions,
  normalizeRole,
  getDefaultPermissionsByRole,
} from "./user.model";

const STORAGE_KEY = "demo_users";

type UpsertPayload = Pick<
  UserItem,
  | "username"
  | "password"
  | "email"
  | "fullName"
  | "address"
  | "phone"
  | "birthDate"
  | "role"
> & {
  permissions?: Permission[];
};

@Injectable({ providedIn: "root" })
export class UserService {
  private subject = new BehaviorSubject<UserItem[]>(this.load());
  users$ = this.subject.asObservable();

  seedIfEmpty() {
    if (this.subject.value.length) return;

    const superadmin: UserItem = {
      username: "superadmin",
      password: "SuperAdmin12345!",
      email: "superadmin@demo.com",
      fullName: "Super Administrador",
      address: "Sistema",
      phone: "0000000000",
      birthDate: "2000-01-01",
      createdAt: new Date().toISOString(),
      role: "superadmin",
      permissions: getDefaultPermissionsByRole("superadmin"),
    };

    const admin: UserItem = {
      username: "admin",
      password: "Admin12345!",
      email: "admin@demo.com",
      fullName: "Administrador del sistema",
      address: "Sistema",
      phone: "0000000001",
      birthDate: "2000-01-01",
      createdAt: new Date().toISOString(),
      role: "admin",
      permissions: getDefaultPermissionsByRole("admin"),
    };

    const member: UserItem = {
      username: "member",
      password: "Member12345!",
      email: "member@demo.com",
      fullName: "Usuario miembro",
      address: "Sistema",
      phone: "0000000002",
      birthDate: "2000-01-01",
      createdAt: new Date().toISOString(),
      role: "member",
      permissions: getDefaultPermissionsByRole("member"),
    };

    const initial = [superadmin, admin, member];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    this.subject.next(initial);
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

  upsert(
    payload: UpsertPayload,
    username?: string,
    actorRole: UserRole = "member"
  ) {
    const list = [...this.subject.value];
    const role = normalizeRole(payload);
    const permissions =
      actorRole === "superadmin"
        ? this.normalizePermissionInput(payload.permissions, role)
        : getDefaultPermissionsByRole(role);

    if (username) {
      const idx = list.findIndex((u) => u.username === username);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          username: payload.username.trim(),
          password: payload.password,
          email: payload.email.trim().toLowerCase(),
          fullName: payload.fullName.trim(),
          address: payload.address.trim(),
          phone: payload.phone.trim(),
          birthDate: payload.birthDate.trim(),
          role,
          permissions,
        };
        this.persist(list);
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
      role,
      permissions,
    };

    list.unshift(created);
    this.persist(list);
    return created;
  }

  remove(username: string) {
    const list = this.subject.value.filter((u) => u.username !== username);
    this.persist(list);
  }

  private normalizePermissionInput(
    permissions: Permission[] | undefined,
    role: UserRole
  ): Permission[] {
    if (!permissions?.length) {
      return getDefaultPermissionsByRole(role);
    }

    const normalized = normalizePermissions({ permissions });
    return normalized.length ? normalized : getDefaultPermissionsByRole(role);
  }

  private persist(list: UserItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.subject.next(list);
  }

  private load(): UserItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const users = raw ? (JSON.parse(raw) as UserItem[]) : [];
      return users.map((user: any) => {
        const role = normalizeRole(user);
        return {
          ...user,
          role,
          permissions: normalizePermissions({
            ...user,
            role,
          }),
        };
      });
    } catch {
      return [];
    }
  }
}