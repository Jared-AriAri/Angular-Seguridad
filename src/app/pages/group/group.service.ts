import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import type { Group } from "./group.model";

const STORAGE_KEY = "demo_groups";

@Injectable({ providedIn: "root" })
export class GroupService {
  private subject = new BehaviorSubject<Group[]>(this.load());
  groups$ = this.subject.asObservable();

  seedIfEmpty() {
    if (this.subject.value.length) return;

    const now = new Date().toISOString();

    const demo: Group[] = [
      {
        id: crypto.randomUUID(),
        name: "Grupo A",
        description: "Grupo de ejemplo",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Grupo B",
        description: "Segundo grupo de ejemplo",
        status: "inactive",
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.persist(demo);
  }

  upsert(
    payload: Pick<Group, "name" | "description" | "status">,
    id?: string
  ) {
    const now = new Date().toISOString();
    const list = [...this.subject.value];

    if (id) {
      const idx = list.findIndex((g) => g.id === id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          name: payload.name.trim(),
          description: payload.description.trim(),
          status: payload.status,
          updatedAt: now,
        };
        this.persist(list);
        return list[idx];
      }
    }

    const created: Group = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      description: payload.description.trim(),
      status: payload.status,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(created);
    this.persist(list);
    return created;
  }

  remove(id: string) {
    const list = this.subject.value.filter((g) => g.id !== id);
    this.persist(list);
  }

  private persist(list: Group[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.subject.next(list);
  }

  private load(): Group[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Group[]) : [];
    } catch {
      return [];
    }
  }
}