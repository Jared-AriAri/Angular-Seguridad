import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { ToolbarModule } from "primeng/toolbar";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TooltipModule } from "primeng/tooltip";

import { MessageService, ConfirmationService } from "primeng/api";

import { GroupService } from "./group.service";
import { AuthContextService } from "../../shared/auth-context.service";
import type { Group } from "./group.model";
import type { Permission } from "../user/user.model";

type FormState = {
  id: string | null;
  name: string;
  description: string;
  status: "active" | "inactive";
};

type GroupMember = {
  username: string;
  fullName: string;
  email: string;
};

const GROUP_MEMBERS_STORAGE_KEY = "group_members";

@Component({
  selector: "app-group-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./group.page.html",
})
export class GroupPage implements OnInit {
  groups: Group[] = [];
  loading = true;
  q = "";

  dialogOpen = false;
  viewOpen = false;

  selected: Group | null = null;

  form: FormState = {
    id: null,
    name: "",
    description: "",
    status: "active",
  };

  constructor(
    private router: Router,
    private svc: GroupService,
    private authContext: AuthContextService,
    private toast: MessageService,
    private confirm: ConfirmationService
  ) { }

  ngOnInit() {
    if (!this.hasPermission("group:view")) {
      this.router.navigate(["/app/home"]);
      return;
    }

    this.svc.seedIfEmpty();
    this.svc.groups$.subscribe((list) => {
      this.groups = this.filterGroupsForCurrentUser(list);
      this.loading = false;
    });
  }

  hasPermission(permission: Permission) {
    return this.authContext.hasPermission(permission);
  }

  openCreate() {
    if (!this.hasPermission("group:create")) return;

    this.form = {
      id: null,
      name: "",
      description: "",
      status: "active",
    };
    this.dialogOpen = true;
  }

  openEdit(g: Group) {
    if (!this.hasPermission("group:edit")) return;
    if (!this.canAccessGroup(g.id)) return;

    this.form = {
      id: g.id,
      name: g.name,
      description: g.description,
      status: g.status,
    };
    this.dialogOpen = true;
  }

  openView(g: Group) {
    if (!this.hasPermission("group:view")) return;
    if (!this.canAccessGroup(g.id)) return;

    this.selected = g;
    this.viewOpen = true;
  }

  openGroup(g: Group) {
    if (!this.hasPermission("group:view")) return;
    if (!this.canAccessGroup(g.id)) return;

    this.router.navigate(["/app/group", g.id]);
  }

  save() {
    if (!(this.hasPermission("group:create") || this.hasPermission("group:edit"))) {
      return;
    }

    const name = this.form.name.trim();

    if (!name) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "El nombre es obligatorio.",
      });
      return;
    }

    if (this.form.id && !this.hasPermission("group:edit")) {
      return;
    }

    if (!this.form.id && !this.hasPermission("group:create")) {
      return;
    }

    const isNew = !this.form.id;

    const saved = this.svc.upsert(
      {
        name,
        description: this.form.description || "",
        status: this.form.status,
      },
      this.form.id || undefined
    );

    if (isNew) {
      this.addCurrentUserToGroup(saved.id);
    }

    this.toast.add({
      severity: "success",
      summary: this.form.id ? "Actualizado" : "Creado",
      detail: saved.name,
    });

    this.dialogOpen = false;
  }

  askDelete(g: Group) {
    if (!this.hasPermission("group:delete")) return;
    if (!this.canAccessGroup(g.id)) return;

    this.confirm.confirm({
      header: "Eliminar grupo",
      message: '¿Seguro que deseas eliminar "' + g.name + '"?',
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.svc.remove(g.id);
        this.removeGroupMembers(g.id);
        this.toast.add({
          severity: "success",
          summary: "Eliminado",
          detail: g.name,
        });
      },
    });
  }

  statusLabel(status: Group["status"]) {
    return status === "active" ? "Activo" : "Inactivo";
  }

  statusSeverity(status: Group["status"]) {
    return status === "active" ? "success" : "secondary";
  }

  private filterGroupsForCurrentUser(groups: Group[]) {
    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return [];

    const membershipMap = this.loadGroupMembers();

    return groups.filter((group) => {
      const members = membershipMap[group.id] || [];

      return members.some(
        (member) =>
          (member.username || "").trim().toLowerCase() ===
          currentUser.username.trim().toLowerCase()
      );
    });
  }

  private canAccessGroup(groupId: string) {
    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return false;

    const membershipMap = this.loadGroupMembers();
    const members = membershipMap[groupId] || [];

    return members.some(
      (member) =>
        (member.username || "").trim().toLowerCase() ===
        currentUser.username.trim().toLowerCase()
    );
  }

  private addCurrentUserToGroup(groupId: string) {
    const currentUser = this.authContext.getCurrentUser();
    if (!currentUser) return;

    const membershipMap = this.loadGroupMembers();
    const members = membershipMap[groupId] || [];

    const exists = members.some(
      (member) =>
        (member.username || "").trim().toLowerCase() ===
        currentUser.username.trim().toLowerCase()
    );

    if (exists) return;

    members.push({
      username: currentUser.username,
      fullName: currentUser.fullName,
      email: currentUser.email,
    });

    membershipMap[groupId] = members;
    localStorage.setItem(GROUP_MEMBERS_STORAGE_KEY, JSON.stringify(membershipMap));
  }

  private removeGroupMembers(groupId: string) {
    const membershipMap = this.loadGroupMembers();
    delete membershipMap[groupId];
    localStorage.setItem(GROUP_MEMBERS_STORAGE_KEY, JSON.stringify(membershipMap));
  }

  private loadGroupMembers(): Record<string, GroupMember[]> {
    try {
      const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}