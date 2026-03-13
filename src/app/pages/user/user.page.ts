import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { ToolbarModule } from "primeng/toolbar";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";

import { MessageService, ConfirmationService } from "primeng/api";

import type { Permission, UserItem } from "./user.model";
import {
  ALL_PERMISSIONS,
  MEMBER_DEFAULT_PERMISSIONS,
  ADMIN_DEFAULT_PERMISSIONS,
  normalizePermissions,
} from "./user.model";
import { AuthContextService } from "../../shared/auth-context.service";

type FormState = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  permissions: Permission[];
};

const STORAGE_KEY = "demo_users";

@Component({
  standalone: true,
  selector: "app-user",
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./user.page.html",
})
export class UserPage implements OnInit, OnDestroy {
  users: UserItem[] = [];
  loading = true;
  q = "";

  dialogOpen = false;
  viewOpen = false;

  selected: UserItem | null = null;
  editingUsername = "";

  permissionOptions = ALL_PERMISSIONS.map((permission) => ({
    label: this.permissionLabel(permission),
    value: permission,
  }));

  form: FormState = {
    username: "",
    password: "",
    email: "",
    fullName: "",
    address: "",
    phone: "",
    birthDate: "",
    permissions: [...MEMBER_DEFAULT_PERMISSIONS],
  };

  private onStorageChange = () => this.refresh();
  private onWindowFocus = () => this.refresh();

  constructor(
    private toast: MessageService,
    private confirm: ConfirmationService,
    private authContext: AuthContextService
  ) {}

  hasPermission(permission: Permission): boolean {
    return this.authContext.hasPermission(permission);
  }

  ngOnInit() {
    this.refresh();
    window.addEventListener("storage", this.onStorageChange);
    window.addEventListener("focus", this.onWindowFocus);
  }

  ngOnDestroy() {
    window.removeEventListener("storage", this.onStorageChange);
    window.removeEventListener("focus", this.onWindowFocus);
  }

  get filteredUsers(): UserItem[] {
    const term = this.q.trim().toLowerCase();

    if (!term) return this.users;

    return this.users.filter((user) => {
      return [
        user.username,
        user.email,
        user.fullName,
        user.address,
        user.phone,
        user.birthDate,
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
    });
  }

  private refresh() {
    this.users = this.loadUsers();
    this.loading = false;
  }

  private loadUsers(): UserItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const users = raw ? (JSON.parse(raw) as UserItem[]) : [];
      return users.map((user: any) => ({
        ...user,
        permissions: normalizePermissions(user),
      }));
    } catch {
      return [];
    }
  }

  private saveUsers(users: UserItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  private trim(v: string) {
    return String(v ?? "").trim();
  }

  private isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  }

  private isPhone(v: string) {
    return /^\d{10,15}$/.test(v);
  }

  openCreate() {
    if (!this.hasPermission('user:create')) return;
    this.editingUsername = "";
    this.form = {
      username: "",
      password: "",
      email: "",
      fullName: "",
      address: "",
      phone: "",
      birthDate: "",
      permissions: [...MEMBER_DEFAULT_PERMISSIONS],
    };
    this.dialogOpen = true;
  }

  openCreateAdmin() {
    if (!this.hasPermission('user:create')) return;
    this.editingUsername = "";
    this.form = {
      username: "",
      password: "",
      email: "",
      fullName: "",
      address: "",
      phone: "",
      birthDate: "",
      permissions: [...ADMIN_DEFAULT_PERMISSIONS],
    };
    this.dialogOpen = true;
  }

  setMemberPreset() {
    this.form.permissions = [...MEMBER_DEFAULT_PERMISSIONS];
  }

  setAdminPreset() {
    this.form.permissions = [...ADMIN_DEFAULT_PERMISSIONS];
  }

  openEdit(user: UserItem) {
    if (!this.hasPermission('user:edit')) return;
    this.editingUsername = user.username;
    this.form = {
      username: user.username,
      password: user.password,
      email: user.email,
      fullName: user.fullName,
      address: user.address,
      phone: user.phone,
      birthDate: user.birthDate,
      permissions: [...user.permissions],
    };
    this.dialogOpen = true;
  }

  openView(user: UserItem) {
    if (!this.hasPermission('user:view')) return;
    this.selected = {
      ...user,
      permissions: [...user.permissions],
    };
    this.viewOpen = true;
  }

  save() {
    const isCreating = !this.editingUsername;
    if (isCreating && !this.hasPermission('user:create')) return;
    if (!isCreating && !this.hasPermission('user:edit')) return;

    const users = this.loadUsers();

    const username = this.trim(this.form.username);
    const email = this.trim(this.form.email).toLowerCase();
    const fullName = this.trim(this.form.fullName);
    const address = this.trim(this.form.address);
    const phone = this.trim(this.form.phone);
    const birthDate = this.trim(this.form.birthDate);
    const password = this.form.password;
    const permissions = Array.from(new Set(this.form.permissions));

    if (!username) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "El usuario es obligatorio.",
      });
      return;
    }

    if (!fullName) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "El nombre completo es obligatorio.",
      });
      return;
    }

    if (!address) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "La dirección es obligatoria.",
      });
      return;
    }

    if (!email || !this.isEmail(email)) {
      this.toast.add({
        severity: "warn",
        summary: "Email inválido",
        detail: "Captura un correo válido.",
      });
      return;
    }

    if (!phone || !this.isPhone(phone)) {
      this.toast.add({
        severity: "warn",
        summary: "Teléfono inválido",
        detail: "Solo números de 10 a 15 dígitos.",
      });
      return;
    }

    if (!birthDate) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "La fecha de nacimiento es obligatoria.",
      });
      return;
    }

    if (!password || password.length < 10) {
      this.toast.add({
        severity: "warn",
        summary: "Contraseña inválida",
        detail: "La contraseña debe tener al menos 10 caracteres.",
      });
      return;
    }

    if (!permissions.length) {
      this.toast.add({
        severity: "warn",
        summary: "Permisos requeridos",
        detail: "Selecciona al menos un permiso.",
      });
      return;
    }

    const usernameExists = users.some(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.username !== this.editingUsername
    );

    if (usernameExists) {
      this.toast.add({
        severity: "warn",
        summary: "Usuario duplicado",
        detail: "Ese usuario ya existe.",
      });
      return;
    }

    const emailExists = users.some(
      (u) =>
        u.email.toLowerCase() === email &&
        u.username !== this.editingUsername
    );

    if (emailExists) {
      this.toast.add({
        severity: "warn",
        summary: "Email duplicado",
        detail: "Ese email ya está registrado.",
      });
      return;
    }

    if (this.editingUsername) {
      const idx = users.findIndex((u) => u.username === this.editingUsername);

      if (idx >= 0) {
        users[idx] = {
          ...users[idx],
          username,
          password,
          email,
          fullName,
          address,
          phone,
          birthDate,
          permissions,
        };
      }

      this.toast.add({
        severity: "success",
        summary: "Actualizado",
        detail: username,
      });
    } else {
      users.unshift({
        username,
        password,
        email,
        fullName,
        address,
        phone,
        birthDate,
        createdAt: new Date().toISOString(),
        role: "member",
        permissions,
      });

      this.toast.add({
        severity: "success",
        summary: "Creado",
        detail: username,
      });
    }

    this.saveUsers(users);
    this.refresh();
    this.dialogOpen = false;
  }

  askDelete(user: UserItem) {
    if (!this.hasPermission('user:delete')) return;
    this.confirm.confirm({
      header: "Eliminar usuario",
      message: '¿Seguro que deseas eliminar "' + user.username + '"?',
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        const users = this.loadUsers().filter((u) => u.username !== user.username);
        this.saveUsers(users);
        this.refresh();

        this.toast.add({
          severity: "success",
          summary: "Eliminado",
          detail: user.username,
        });
      },
    });
  }

  togglePermission(permission: Permission) {
    if (this.form.permissions.includes(permission)) {
      this.form.permissions = this.form.permissions.filter((p) => p !== permission);
      return;
    }

    this.form.permissions = [...this.form.permissions, permission];
  }

  hasSelectedPermission(permission: Permission) {
    return this.form.permissions.includes(permission);
  }

  permissionLabel(permission: Permission) {
    const labels: Record<Permission, string> = {
      "home:view": "Home ver",
      "profile:view": "Perfil ver",
      "group:view": "Grupo ver",
      "group:create": "Grupo crear",
      "group:edit": "Grupo editar",
      "group:delete": "Grupo eliminar",
      "group:members": "Grupo miembros",
      "ticket:view": "Ticket ver",
      "ticket:create": "Ticket crear",
      "ticket:edit": "Ticket editar",
      "ticket:delete": "Ticket eliminar",
      "ticket:comment": "Ticket comentar",
      "ticket:assign": "Ticket asignar",
      "user:view": "Usuario ver",
      "user:create": "Usuario crear",
      "user:edit": "Usuario editar",
      "user:delete": "Usuario eliminar",
    };

    return labels[permission];
  }

  permissionSeverity(permission: Permission) {
    if (permission.startsWith("user:")) return "danger";
    if (permission.startsWith("group:")) return "info";
    if (permission.startsWith("ticket:")) return "warn";
    return "secondary";
  }

  permissionCountLabel(user: UserItem) {
    const count = user.permissions?.length || 0;
    if (count === ADMIN_DEFAULT_PERMISSIONS.length) return "Admin";
    if (count === MEMBER_DEFAULT_PERMISSIONS.length) return "Member";
    return `${count} permisos`;
  }
}