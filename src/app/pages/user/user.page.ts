import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { ToolbarModule } from "primeng/toolbar";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { MessageService, ConfirmationService } from "primeng/api";
import { AuthService } from "../../core/services/auth.service";
import { UserService } from "../../core/services/user.service";
import { Permission, ALL_PERMISSIONS } from "../../core/models/user.model";
import { filter, take } from "rxjs";
import { UserDetailModalComponent } from "./components/user-detail/user-detail-modal";

interface FormState {
  id?: string;
  username: string;
  email: string;
  password?: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
  fecha_nacimiento: any;
}

@Component({
  standalone: true,
  selector: "app-user",
  imports: [
    CommonModule, FormsModule, CardModule, TableModule, ToolbarModule, DialogModule,
    InputTextModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule,
    DatePickerModule, MessageModule, CheckboxModule, TooltipModule, UserDetailModalComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./user.page.html",
})
export class UserPage implements OnInit {
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  loading = true;
  q = "";
  dialogOpen = false;
  viewOpen = false;
  permissionsOpen = false;
  selectedUser: any = null;
  userPermissions: string[] = [];

  allPermissionsList = ALL_PERMISSIONS.filter(p =>
    p !== 'group:manage' && p !== 'home:view' as any && p !== 'profile:view' as any
  );

  form: FormState = this.resetForm();

  private resetForm(): FormState {
    return { username: "", email: "", password: "", nombre_completo: "", direccion: "", telefono: "", fecha_nacimiento: null };
  }

  ngOnInit() {
    this.authService.initialized$.pipe(filter(init => init === true), take(1)).subscribe(() => {
      this.refresh();
    });
  }

  async refresh() {
    this.loading = true;
    try {
      const res: any = await this.userService.getAll();
      this.users = (res?.data || res || []).map((u: any) => ({
        ...u,
        nombre_completo: u.nombre_completo || u.fullName,
        createdAt: u.creado_en || u.createdAt
      }));
    } catch (error) {
      this.toast.add({ severity: "error", summary: "Error", detail: "Error al cargar usuarios" });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openCreate() {
    this.form = this.resetForm();
    this.dialogOpen = true;
  }

  openEdit(user: any) {
    this.form = { ...user, fecha_nacimiento: user.fecha_nacimiento ? new Date(user.fecha_nacimiento) : null, password: "" };
    this.dialogOpen = true;
  }

  async save() {
    if (!this.form.username || !this.form.nombre_completo || !this.form.email || (!this.form.id && !this.form.password)) {
      this.toast.add({ severity: "warn", summary: "Info", detail: "Faltan campos obligatorios" });
      return;
    }

    try {
      if (!this.form.id) {
        await this.userService.create(this.form);
        this.toast.add({ severity: "success", summary: "Éxito", detail: "Usuario creado" });
      } else {
        await this.userService.update(this.form.id, this.form);
        this.toast.add({ severity: "success", summary: "Éxito", detail: "Usuario actualizado" });
      }
      this.dialogOpen = false;
      this.refresh();
    } catch (error: any) {
      this.toast.add({ severity: "error", summary: "Error", detail: error.error?.message || "Error al guardar" });
    }
  }

  openPermissions(user: any) {
    this.selectedUser = user;
    this.userPermissions = Array.isArray(user.permisos_globales) ? [...user.permisos_globales] : [];
    this.permissionsOpen = true;
  }

  async savePermissions() {
    try {
      await this.userService.updatePermissions(this.selectedUser.id, this.userPermissions);
      this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Permisos actualizados' });
      this.permissionsOpen = false;
      this.refresh();
    } catch (error) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
    }
  }

  askDelete(user: any) {
    this.confirm.confirm({
      header: "Eliminar",
      message: `¿Borrar a ${user.nombre_completo}?`,
      accept: async () => {
        try {
          await this.userService.remove(user.id);
          this.toast.add({ severity: "success", detail: "Eliminado" });
          this.refresh();
        } catch (error) {
          this.toast.add({ severity: "error", detail: "Error al eliminar" });
        }
      }
    });
  }

  hasPermission(permission: Permission): boolean {
    return this.authService.hasPermission(permission);
  }

  get filteredUsers(): any[] {
    const term = this.q.trim().toLowerCase();
    if (!term) return this.users;
    return this.users.filter((user) =>
      [user.username, user.email, user.nombre_completo].some((v) => String(v ?? "").toLowerCase().includes(term))
    );
  }

  openView(user: any) {
    this.selectedUser = user;
    this.viewOpen = true;
  }
}