import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: "./login.html",
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  email = "";
  pass = "";
  loading = false;

  async login() {
    const email = this.email.trim().toLowerCase();
    const password = this.pass;

    if (!email || !password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Completa todos los campos'
      });
      return;
    }

    this.loading = true;

    try {
      const response: any = await this.authService.login({ email, password });

      console.log('Respuesta completa del servidor:', response);

      const token = response.token;

      if (token) {
        localStorage.setItem('session_token', token);

        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: 'Login correcto'
        });

        setTimeout(() => {
          this.router.navigate(['/app/home']);
        }, 800);
      } else {
        throw new Error('El servidor no envió el campo "token"');
      }
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de acceso',
        detail: err.error?.message || err.message || 'Credenciales inválidas'
      });
    } finally {
      this.loading = false;
    }
  }
}