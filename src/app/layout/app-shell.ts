import { Component, OnInit, inject } from "@angular/core";
import { RouterOutlet, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MenuItem } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { AuthService } from "../core/services/auth.service";
import { map, filter, take } from "rxjs";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, TagModule],
  templateUrl: "./app-shell.html",
})
export class AppShellComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  projectName = "ERP System";
  apiVersion = "v1.0";

  user$ = this.auth.currentUser$;

  menuItems$ = this.auth.currentUser$.pipe(
    map(user => this.buildMenu(user))
  );

  ngOnInit() {
    this.auth.initialized$.pipe(
      filter(init => init === true),
      take(1)
    ).subscribe(() => {
      if (!this.auth.getCurrentUser()) {
        this.router.navigate(['/login']);
      }
    });
  }

  async logout() {
    await this.auth.logout();
    this.router.navigateByUrl("/login");
  }

  private buildMenu(user: any): MenuItem[] {
    if (!user) return [];
    const menu: MenuItem[] = [
      { label: "Dashboard", icon: "pi pi-home", routerLink: "/app/home" }
    ];

    if (this.auth.hasPermission("group:view")) {
      menu.push({ label: "Grupos", icon: "pi pi-users", routerLink: "/app/group" });
    }

    if (this.auth.hasPermission("user:view")) {
      menu.push({ label: "Usuarios", icon: "pi pi-user-plus", routerLink: "/app/user" });
    }

    menu.push({ label: "Mi Perfil", icon: "pi pi-id-card", routerLink: "/app/profile" });
    return menu;
  }
}