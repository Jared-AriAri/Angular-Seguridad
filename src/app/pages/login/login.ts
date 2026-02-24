import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private readonly HARD_USER = 'admin';
  private readonly HARD_PASS = 'Admin@12345!';

  user = '';
  pass = '';

  error = '';
  success = '';

  constructor(private router: Router) {}

  login() {
    this.error = '';
    this.success = '';

    const u = this.user.trim();
    const p = this.pass;

    if (!u || !p) {
      this.error = 'Completa usuario y contraseña.';
      return;
    }

    if (u === this.HARD_USER && p === this.HARD_PASS) {
      this.success = 'Login correcto ✅';
      setTimeout(() => this.router.navigateByUrl('/'), 400);
      return;
    }

    this.error = 'Credenciales inválidas ❌';
  }
}