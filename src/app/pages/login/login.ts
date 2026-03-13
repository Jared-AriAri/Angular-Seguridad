import { Component, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { MessageModule } from "primeng/message";

import type { UserItem } from "../user/user.model";
import {
  normalizePermissions,
  normalizeRole,
  getDefaultPermissionsByRole,
} from "../user/user.model";

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
})
export class LoginComponent implements OnInit {
  email = "";
  pass = "";

  error = "";
  success = "";

  constructor(private router: Router) { }

  ngOnInit() {
    this.ensureUsersExist();
  }

  private ensureUsersExist() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const users: UserItem[] = raw ? JSON.parse(raw) : [];

      if (users.length) return;

      const now = new Date().toISOString();

      const superadmin: UserItem = {
        username: "superadmin",
        password: "SuperAdmin12345!",
        email: "superadmin@demo.com",
        fullName: "Super Administrador",
        address: "Sistema",
        phone: "0000000000",
        birthDate: "2000-01-01",
        createdAt: now,
        role: "superadmin",
        permissions: getDefaultPermissionsByRole("superadmin"),
      };

      const admin: UserItem = {
        username: "admin",
        password: "Admin12345!",
        email: "admin@demo.com",
        fullName: "Administrador del sistema",
        address: "Sistema",
        phone: "0000000001",
        birthDate: "2000-01-01",
        createdAt: now,
        role: "admin",
        permissions: getDefaultPermissionsByRole("admin"),
      };

      const member: UserItem = {
        username: "member",
        password: "Member12345!",
        email: "member@demo.com",
        fullName: "Usuario miembro",
        address: "Sistema",
        phone: "0000000002",
        birthDate: "2000-01-01",
        createdAt: now,
        role: "member",
        permissions: getDefaultPermissionsByRole("member"),
      };

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify([superadmin, admin, member])
      );
    } catch { }
  }

  private loadUsers(): UserItem[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
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

  login() {
    this.error = "";
    this.success = "";

    const email = this.email.trim().toLowerCase();
    const password = this.pass;

    if (!email || !password) {
      this.error = "Completa email y contraseña.";
      return;
    }

    const users = this.loadUsers();

    const validUser =
      users.find(
        (u) => (u.email ?? "").toLowerCase() === email && u.password === password
      ) || null;

    if (!validUser) {
      this.error = "Credenciales inválidas ❌";
      return;
    }

    this.success = "Login correcto ✅";

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("currentUsername", validUser.username);
    localStorage.setItem("currentUserRole", validUser.role);
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: validUser.username,
        fullName: validUser.fullName,
        email: validUser.email,
        role: validUser.role,
        permissions: validUser.permissions,
      })
    );

    setTimeout(() => this.router.navigateByUrl("/app/home"), 400);
  }
}