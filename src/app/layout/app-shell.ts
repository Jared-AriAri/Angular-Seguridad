import { Component } from "@angular/core";
import { RouterOutlet, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MenuItem } from "primeng/api";

import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { TagModule } from "primeng/tag";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from "primeng/splitter";
import { MenuModule } from "primeng/menu";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ButtonModule,
    DividerModule,
    TagModule,
    PanelModule,
    SplitterModule,
    MenuModule,
  ],
  templateUrl: "./app-shell.html",
  styleUrls: ["./app-shell.css"],
})
export class AppShellComponent {
  projectName = "primeng-test";
  apiVersion = "v1";

  menuItems: MenuItem[] = [
    { label: "Home", icon: "pi pi-home", routerLink: "/app/home" },
    { label: "Group", icon: "pi pi-users", routerLink: "/app/group" },
    { label: "User", icon: "pi pi-user", routerLink: "/app/user" },
  ];

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem("loggedIn");
    this.router.navigateByUrl("/");
  }
}