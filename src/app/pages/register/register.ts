import { Component, inject } from "@angular/core";
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

import { AuthService } from "../../core/services/auth.service";

const SPECIALS = /[!@#$%^&*()_\+\-=\[\]{};':",.<>\/?\|\\]/;

type RegisterErrors = {
  username?: string;
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
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
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = "";
  email = "";
  fullName = "";
  address = "";
  phone = "";
  birthDate: Date | null = null;
  password = "";
  confirmPassword = "";

  submitted = false;
  loading = false;
  success = "";
  errors: RegisterErrors = {};

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
    if (!d) return null;
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

  private validateSync(): RegisterErrors {
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
    else if (!this.isPhone(phone)) {
      e.phone = "El teléfono debe tener exactamente 10 dígitos.";
    }

    if (!this.birthDate) e.birthDate = "Fecha de nacimiento requerida.";
    else if (!this.isAdult(this.birthDate)) {
      e.birthDate = "Solo mayores de edad (18+).";
    }

    if (!pass) e.password = "Contraseña requerida.";
    else if (pass.length < 10) e.password = "Mínimo 10 caracteres.";
    else if (!SPECIALS.test(pass)) {
      e.password = "Debe incluir al menos 1 símbolo especial.";
    }

    if (!this.confirmPassword) e.confirmPassword = "Confirma tu contraseña.";
    else if (this.confirmPassword !== this.password) {
      e.confirmPassword = "Las contraseñas no coinciden.";
    }

    return e;
  }

  async submit() {
    if (this.loading) return;

    this.submitted = true;
    this.success = "";
    this.loading = true;
    this.errors = {};

    const syncErrors = this.validateSync();
    if (Object.keys(syncErrors).length > 0) {
      this.errors = syncErrors;
      this.loading = false;
      return;
    }

    const payload = {
      username: this.trim(this.username),
      email: this.trim(this.email).toLowerCase(),
      fullName: this.trim(this.fullName),
      address: this.trim(this.address),
      phone: this.normalizePhone(this.phone),
      birthDate: this.toISODate(this.birthDate),
      password: this.password
    };

    try {
      await this.authService.register(payload);
      this.success = "Usuario registrado correctamente. Revisa tu correo para confirmar la cuenta.";
      setTimeout(() => this.router.navigateByUrl("/login"), 1500);
    } catch (error: any) {
      this.errors.general = error?.error?.message || "No se pudo completar el registro.";
      if (this.errors.general?.includes("username")) this.errors.username = "Este usuario ya existe.";
      if (this.errors.general?.includes("email")) this.errors.email = "Este email ya está registrado.";
    } finally {
      this.loading = false;
    }
  }
}