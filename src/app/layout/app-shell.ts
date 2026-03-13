import { Component, OnInit } from "@angular/core";
import { RouterOutlet, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MenuItem } from "primeng/api";

import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { TagModule } from "primeng/tag";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from "primeng/splitter";
import { MenuModule } from "primeng/menu";

import { AuthContextService } from "../shared/auth-context.service";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    PanelModule,
    SplitterModule,
    MenuModule,
  ],
  templateUrl: "./app-shell.html",
})
export class AppShellComponent implements OnInit {
  projectName = "primeng-test";
  apiVersion = "v1";
  llmModel = this.resolveLlmModel();

  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authContext: AuthContextService
  ) { }

  ngOnInit() {
    this.menuItems = this.buildMenu();
  }

  logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUsername");
    localStorage.removeItem("currentUserRole");
    this.router.navigateByUrl("/");
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + "/");
  }

  private buildMenu(): MenuItem[] {
    const menu: MenuItem[] = [];

    if (this.authContext.hasPermission("home:view")) {
      menu.push({
        label: "Home",
        icon: "pi pi-home",
        routerLink: "/app/home",
      });
    }

    if (this.authContext.hasPermission("profile:view")) {
      menu.push({
        label: "Mi Perfil",
        icon: "pi pi-id-card",
        routerLink: "/app/profile",
      });
    }

    if (this.authContext.hasPermission("group:view")) {
      menu.push({
        label: "Group",
        icon: "pi pi-users",
        routerLink: "/app/group",
      });
    }

    if (this.authContext.hasPermission("user:view")) {
      menu.push({
        label: "User",
        icon: "pi pi-user",
        routerLink: "/app/user",
      });
    }

    return menu;
  }

  private resolveLlmModel(): string {
    const directKeys = [
      "llmModel",
      "selectedLLM",
      "selectedLlm",
      "model",
      "aiModel",
    ];

    for (const key of directKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value;
    }

    const jsonKeys = ["settings", "appSettings", "preferences"];

    for (const key of jsonKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const value =
          parsed?.llmModel ||
          parsed?.selectedLLM ||
          parsed?.selectedLlm ||
          parsed?.model ||
          parsed?.aiModel;

        if (value && String(value).trim()) return String(value);
      } catch { }
    }

    return "No configurado";
  }
}