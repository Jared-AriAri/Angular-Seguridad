import { Routes } from "@angular/router";
import { LandingComponent } from "./pages/landing/landing";
import { LoginComponent } from "./pages/login/login";
import { RegisterComponent } from "./pages/register/register";
import { AppShellComponent } from "./layout/app-shell";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout";
import { HomePage } from "./home/home";
import { GroupPage } from "./pages/group/group.page";
import { UserPage } from "./pages/user/user.page";
import { GroupDetailPage } from "./pages/group/components/group-detail/group-detail.page";
import { permissionGuard } from "./core/guards/permission.guard";

export const routes: Routes = [
  {
    path: "",
    component: AuthLayoutComponent,
    children: [
      { path: "", component: LandingComponent },
      { path: "login", component: LoginComponent },
      { path: "register", component: RegisterComponent }
    ]
  },
  {
    path: "app",
    component: AppShellComponent,
    canActivate: [permissionGuard],
    children: [
      { path: "", redirectTo: "home", pathMatch: "full" },
      {
        path: "home",
        component: HomePage
      },
      {
        path: "group",
        component: GroupPage,
        data: { permission: 'group:view' }
      },
      { path: "group/:id", component: GroupDetailPage },
      { path: "user", component: UserPage, data: { permission: 'user:view' } },
      {
        path: "profile",
        loadComponent: () => import('./pages/profile/profile.page').then(c => c.ProfilePage)
      }
    ]
  },
  { path: "**", redirectTo: "" }
];