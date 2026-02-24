import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

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

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  username = '';
  email = '';
  fullName = '';
  address = '';
  phone = '';
  birthDate = '';
  password = '';
  confirmPassword = '';

  submitted = false;
  success = '';

  errors: RegisterErrors = {};

  private trim(v: string) {
    return String(v ?? '').trim();
  }

  private isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  }

  private isPhone(v: string) {
    return /^\d{10,15}$/.test(v);
  }

  private isAdult(birthDate: string) {
    if (!birthDate) return false;
    const dob = new Date(birthDate);
    if (Number.isNaN(dob.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  }

  onPhoneInput(v: string) {
    this.phone = (v ?? '').replace(/\D/g, '');
  }

  private validate(): RegisterErrors {
    const e: RegisterErrors = {};

    if (!this.trim(this.username)) e.username = 'Usuario requerido.';
    if (!this.trim(this.fullName)) e.fullName = 'Nombre completo requerido.';
    if (!this.trim(this.address)) e.address = 'Dirección requerida.';

    const mail = this.trim(this.email);
    if (!mail) e.email = 'Email requerido.';
    else if (!this.isEmail(mail)) e.email = 'Email inválido.';

    const phone = this.trim(this.phone);
    if (!phone) e.phone = 'Teléfono requerido.';
    else if (!this.isPhone(phone)) e.phone = 'Teléfono inválido: solo números (10–15).';

    if (!this.birthDate) e.birthDate = 'Fecha de nacimiento requerida.';
    else if (!this.isAdult(this.birthDate)) e.birthDate = 'Solo mayores de edad (18+).';

    const pass = this.password;
    if (!pass) e.password = 'Contraseña requerida.';
    else {
      if (pass.length < 10) e.password = 'Mínimo 10 caracteres.';
      else if (!SPECIALS.test(pass)) e.password = 'Debe incluir al menos 1 símbolo especial.';
    }

    if (!this.confirmPassword) e.confirmPassword = 'Confirma tu contraseña.';
    else if (this.confirmPassword !== this.password) e.confirmPassword = 'Las contraseñas no coinciden.';

    return e;
  }

  get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  submit() {
    this.submitted = true;
    this.success = '';

    this.errors = this.validate();

    if (!this.isValid) return;

    this.success = 'Registro válido ✅';
  }
}