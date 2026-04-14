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
  nombre_completo: string;
  direccion: string;
  telefono: string;
  fecha_nacimiento: string;
}

@Component({
  standalone: true,
  selector: "app-user",
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DatePickerModule,
    MessageModule,
    CheckboxModule,
    TooltipModule,
    UserDetailModalComponent
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

  allPermissionsList = ALL_PERMISSIONS.filter(p => p !== 'group:manage' && p !== 'home:view' as any);

  form: FormState = {
    username: "",
    email: "",
    nombre_completo: "",
    direccion: "",
    telefono: "",
    fecha_nacimiento: "",
  };

  ngOnInit() {
    this.authService.initialized$.pipe(
      filter(init => init === true),
      take(1)
    ).subscribe(() => {
      if (this.hasPermission("user:view")) {
        this.refresh();
      } else {
        this.loading = false;
        this.cdr.detectChanges();
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
      [user.username, user.email, user.nombre_completo, user.direccion, user.telefono]
        .some((value) => String(value ?? "").toLowerCase().includes(term))
    );
  }

  async refresh() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const res: any = await this.userService.getAll();
      const rawUsers = res?.data || res || [];

      this.users = rawUsers.map((u: any) => ({
        ...u,
        nombre_completo: u.nombre_completo || u.fullName,
        createdAt: u.creado_en || u.createdAt
      }));
    } catch (error) {
      this.toast.add({ severity: "error", summary: "Error", detail: "No se pudieron cargar los usuarios" });
      this.users = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openCreate() {
    this.form = { username: "", email: "", nombre_completo: "", direccion: "", telefono: "", fecha_nacimiento: "" };
    this.dialogOpen = true;
    this.cdr.detectChanges();
  }

  openEdit(user: any) {
    this.form = {
      ...user,
      nombre_completo: user.nombre_completo || user.fullName
    };
    this.dialogOpen = true;
    this.cdr.detectChanges();
  }

  openView(user: any) {
    this.selectedUser = {
      ...user,
      nombre_completo: user.nombre_completo || user.fullName,
      permisos_globales: user.permisos_globales || user.permissions || []
    };
    this.viewOpen = true;
    this.cdr.detectChanges();
  }

  openPermissions(user: any) {
    this.selectedUser = user;
    const raw = user.permisos_globales || user.permissions || [];
    this.userPermissions = Array.isArray(raw) ? [...raw].filter(p => p !== 'group:manage' && p !== 'home:view') : [];
    this.permissionsOpen = true;
    this.cdr.detectChanges();
  }

  async savePermissions() {
    if (!this.selectedUser) return;
    try {
      await this.userService.updatePermissions(this.selectedUser.id, this.userPermissions);
      this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Permisos actualizados' });
      this.permissionsOpen = false;
      await this.refresh();
    } catch (error) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar' });
    }
  }

  async save() {
    if (!this.form.username || !this.form.nombre_completo || !this.form.email) {
      this.toast.add({ severity: "warn", summary: "Info", detail: "Campos obligatorios faltantes" });
      return;
    }

    const payload = {
      ...this.form,
      nombre_completo: this.form.nombre_completo
    };

    try {
      if (!this.form.id) {
        await this.userService.create(payload);
      } else {
        await this.userService.update(this.form.id, payload);
      }
      this.dialogOpen = false;
      await this.refresh();
    } catch (error) {
      this.toast.add({ severity: "error", summary: "Error", detail: "Error al guardar" });
    }
  }

  askDelete(user: any) {
    this.confirm.confirm({
      header: "Eliminar",
      message: `¿Borrar a ${user.username}?`,
      accept: async () => {
        try {
          await this.userService.remove(user.id);
          await this.refresh();
        } catch (error) {
          this.toast.add({ severity: "error", detail: "No se pudo eliminar" });
        }
      }
    });
  }
}