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

const SPECIALS = /[!@#$%^&*()_\+\-=\[\]{};':",.<>\/\?\\|]/;

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

const STORAGE_KEY = "demo_users";

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

  constructor(private router: Router) {}

  private trim(v: string) {
    return String(v ?? "").trim();
  }

  private isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  }

  private isPhone(v: string) {
    return /^\d{10,15}$/.test(v);
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

  onPhoneInput(v: string) {
    this.phone = String(v ?? "").replace(/\D/g, "");
    this.clearError("phone");
  }

  clearError<K extends keyof RegisterErrors>(key: K) {
    if (this.errors[key]) {
      delete this.errors[key];
      this.errors = { ...this.errors };
    }
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

  private validate(): RegisterErrors {
    const e: RegisterErrors = {};

    if (!this.trim(this.username)) e.username = "Usuario requerido.";
    if (!this.trim(this.fullName)) e.fullName = "Nombre completo requerido.";
    if (!this.trim(this.address)) e.address = "Dirección requerida.";

    const mail = this.trim(this.email);
    if (!mail) e.email = "Email requerido.";
    else if (!this.isEmail(mail)) e.email = "Email inválido.";

    const phone = this.trim(this.phone);
    if (!phone) e.phone = "Teléfono requerido.";
    else if (!this.isPhone(phone)) e.phone = "Teléfono inválido: solo números (10–15).";

    if (!this.birthDate) e.birthDate = "Fecha de nacimiento requerida.";
    else if (!this.isAdult(this.birthDate)) e.birthDate = "Solo mayores de edad (18+).";

    const pass = this.password;
    if (!pass) e.password = "Contraseña requerida.";
    else if (pass.length < 10) e.password = "Mínimo 10 caracteres.";
    else if (!SPECIALS.test(pass)) e.password = "Debe incluir al menos 1 símbolo especial.";

    if (!this.confirmPassword) e.confirmPassword = "Confirma tu contraseña.";
    else if (this.confirmPassword !== this.password) e.confirmPassword = "Las contraseñas no coinciden.";

    const users = this.loadUsers();
    const uNorm = this.trim(this.username).toLowerCase();
    if (users.some((x) => (x.username ?? "").toLowerCase() === uNorm)) e.username = "Ese usuario ya existe.";

    const emailNorm = mail.toLowerCase();
    if (emailNorm && users.some((x) => (x.email ?? "").toLowerCase() === emailNorm)) e.email = "Ese email ya está registrado.";

    return e;
  }

  get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  submit() {
    this.submitted = true;
    this.success = "";

    this.errors = this.validate();
    if (!this.isValid) return;

    const users = this.loadUsers();

    const newUser: StoredUser = {
      username: this.trim(this.username),
      password: this.password,
      email: this.trim(this.email),
      fullName: this.trim(this.fullName),
      address: this.trim(this.address),
      phone: this.trim(this.phone),
      birthDate: this.toISODate(this.birthDate),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    this.success = "Registro guardado ✅ Redirigiendo a Login...";
    setTimeout(() => this.router.navigateByUrl("/login"), 600);
  }
}