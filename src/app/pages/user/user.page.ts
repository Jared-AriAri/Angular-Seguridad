import { Component, OnInit } from "@angular/core";
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

type StoredUser = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
};

type FormState = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
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
export class UserPage implements OnInit {
  users: StoredUser[] = [];
  loading = true;
  q = "";

  dialogOpen = false;
  viewOpen = false;

  selected: StoredUser | null = null;
  editingUsername = "";

  form: FormState = {
    username: "",
    password: "",
    email: "",
    fullName: "",
    address: "",
    phone: "",
    birthDate: "",
  };

  constructor(
    private toast: MessageService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  private refresh() {
    this.users = this.loadUsers();
    this.loading = false;
  }

  private loadUsers(): StoredUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]) {
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
    this.editingUsername = "";
    this.form = {
      username: "",
      password: "",
      email: "",
      fullName: "",
      address: "",
      phone: "",
      birthDate: "",
    };
    this.dialogOpen = true;
  }

  openEdit(user: StoredUser) {
    this.editingUsername = user.username;
    this.form = {
      username: user.username,
      password: user.password,
      email: user.email,
      fullName: user.fullName,
      address: user.address,
      phone: user.phone,
      birthDate: user.birthDate,
    };
    this.dialogOpen = true;
  }

  openView(user: StoredUser) {
    this.selected = user;
    this.viewOpen = true;
  }

  save() {
    const users = this.loadUsers();

    const username = this.trim(this.form.username);
    const email = this.trim(this.form.email).toLowerCase();
    const fullName = this.trim(this.form.fullName);
    const address = this.trim(this.form.address);
    const phone = this.trim(this.form.phone);
    const birthDate = this.trim(this.form.birthDate);
    const password = this.form.password;

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

  askDelete(user: StoredUser) {
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
}