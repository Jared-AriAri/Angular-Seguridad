import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import type { UserItem } from "./user.model";

const STORAGE_KEY = "demo_users_crud";

@Injectable({ providedIn: "root" })
export class UserService {
  private subject = new BehaviorSubject<UserItem[]>(this.load());
  users$ = this.subject.asObservable();

  seedIfEmpty() {
    if (this.subject.value.length) return;

    const now = new Date().toISOString();

    const demo: UserItem[] = [
      {
        id: crypto.randomUUID(),
        name: "Jared Admin",
        email: "admin@demo.com",
        role: "admin",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Usuario Demo",
        email: "user@demo.com",
        role: "member",
        status: "inactive",
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.persist(demo);
  }

  upsert(
    payload: Pick<UserItem, "name" | "email" | "role" | "status">,
    id?: string
  ) {
    const now = new Date().toISOString();
    const list = [...this.subject.value];

    if (id) {
      const idx = list.findIndex((u) => u.id === id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          role: payload.role,
          status: payload.status,
          updatedAt: now,
        };
        this.persist(list);
        return list[idx];
      }
    }

    const created: UserItem = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      status: payload.status,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(created);
    this.persist(list);
    return created;
  }

  remove(id: string) {
    const list = this.subject.value.filter((u) => u.id !== id);
    this.persist(list);
  }

  private persist(list: UserItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.subject.next(list);
  }

  private load(): UserItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserItem[]) : [];
    } catch {
      return [];
    }
  }
}