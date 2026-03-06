import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { MessageModule } from "primeng/message";

type StoredUser = {
  email: string;
  password: string;
};

const USERS_KEY = "demo_users";

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
  ],
  templateUrl: "./login.html",
  styleUrls: [],
})
export class LoginComponent {
  email = "";
  pass = "";

  error = "";
  success = "";

  constructor(private router: Router) {}

  private loadUsers(): StoredUser[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  login() {
    this.error = "";
    this.success = "";

    const e = this.email.trim().toLowerCase();
    const p = this.pass;

    if (!e || !p) {
      this.error = "Completa email y contraseña.";
      return;
    }

    const users = this.loadUsers();

    const valid = users.some((u) => (u.email ?? "").toLowerCase() === e && u.password === p);

    if (valid) {
      this.success = "Login correcto ✅";
      localStorage.setItem("loggedIn", "true");
      setTimeout(() => this.router.navigateByUrl("/app/home"), 400);
      return;
    }

    this.error = "Credenciales inválidas ❌";
  }
}