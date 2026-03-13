import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { InputMaskModule } from "primeng/inputmask";
import { DatePickerModule } from "primeng/datepicker";
import { PasswordModule } from "primeng/password";

import type { UserItem } from "../user/user.model";
import {
  normalizePermissions,
  normalizeRole,
  getDefaultPermissionsByRole,
} from "../user/user.model";

const SPECIALS = /[!@#$%^&*()_\+\-=\[\]{};':",.<>\/\?\\|]/;
const STORAGE_KEY = "demo_users";

type RegisterErrors = {
  username?: string;
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
};

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    DatePickerModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: "./register.html",
  styleUrls: [],
})
export class RegisterComponent {
  username = "";
  email = "";
  fullName = "";
  address = "";
  phone = "";
  birthDate: Date | null = null;
  password = "";
  confirmPassword = "";

  submitted = false;
  success = "";
  errors: RegisterErrors = {};

  constructor(private router: Router) { }

  private trim(v: string) {
    return String(v ?? "").trim();
  }

  private normalizePhone(v: string) {
    return String(v ?? "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  private isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  }

  private isPhone(v: string) {
    return /^\d{10}$/.test(v);
  }

  private toISODate(d: Date | null) {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  private isAdult(d: Date | null) {
    if (!d) return false;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 18;
  }

  onPhoneInput(value: string) {
    this.phone = this.normalizePhone(value);
    this.clearError("phone");
  }

  clearError<K extends keyof RegisterErrors>(key: K) {
    if (this.errors[key]) {
      delete this.errors[key];
      this.errors = { ...this.errors };
    }
  }

  private loadUsers(): UserItem[] {
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

  private saveUsers(users: UserItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  private validate(): RegisterErrors {
    const e: RegisterErrors = {};

    const username = this.trim(this.username);
    const fullName = this.trim(this.fullName);
    const address = this.trim(this.address);
    const mail = this.trim(this.email);
    const phone = this.normalizePhone(this.phone);
    const pass = this.password;

    if (!username) e.username = "Usuario requerido.";
    if (!fullName) e.fullName = "Nombre completo requerido.";
    if (!address) e.address = "Dirección requerida.";

    if (!mail) e.email = "Email requerido.";
    else if (!this.isEmail(mail)) e.email = "Email inválido.";

    if (!phone) e.phone = "Teléfono requerido.";
    else if (!this.isPhone(phone)) e.phone = "El teléfono debe tener exactamente 10 dígitos.";

    if (!this.birthDate) e.birthDate = "Fecha de nacimiento requerida.";
    else if (!this.isAdult(this.birthDate)) e.birthDate = "Solo mayores de edad (18+).";

    if (!pass) e.password = "Contraseña requerida.";
    else if (pass.length < 10) e.password = "Mínimo 10 caracteres.";
    else if (!SPECIALS.test(pass)) e.password = "Debe incluir al menos 1 símbolo especial.";

    if (!this.confirmPassword) e.confirmPassword = "Confirma tu contraseña.";
    else if (this.confirmPassword !== this.password) e.confirmPassword = "Las contraseñas no coinciden.";

    const users = this.loadUsers();
    const usernameNorm = username.toLowerCase();
    if (users.some((x) => (x.username ?? "").toLowerCase() === usernameNorm)) {
      e.username = "Ese usuario ya existe.";
    }

    const emailNorm = mail.toLowerCase();
    if (emailNorm && users.some((x) => (x.email ?? "").toLowerCase() === emailNorm)) {
      e.email = "Ese email ya está registrado.";
    }

    return e;
  }

  get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  submit() {
    this.submitted = true;
    this.success = "";
    this.phone = this.normalizePhone(this.phone);

    this.errors = this.validate();
    if (!this.isValid) return;

    const users = this.loadUsers();

    const newUser: UserItem = {
      username: this.trim(this.username),
      password: this.password,
      email: this.trim(this.email).toLowerCase(),
      fullName: this.trim(this.fullName),
      address: this.trim(this.address),
      phone: this.normalizePhone(this.phone),
      birthDate: this.toISODate(this.birthDate),
      createdAt: new Date().toISOString(),
      role: "member",
      permissions: getDefaultPermissionsByRole("member"),
    };

    users.push(newUser);
    this.saveUsers(users);

    this.success = "Registro guardado ✅ Redirigiendo a Login...";
    setTimeout(() => this.router.navigateByUrl("/login"), 600);
  }
}