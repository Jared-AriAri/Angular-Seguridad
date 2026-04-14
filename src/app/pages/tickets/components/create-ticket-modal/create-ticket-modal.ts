import { Component, EventEmitter, Input, Output, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";

import { TicketService } from "../../../../core/services/ticket.service";
import { UserService } from "../../../../core/services/user.service";
import { AuthService } from "../../../../core/services/auth.service";
import { ApiService } from "../../../../core/api.service";

@Component({
  selector: "app-create-ticket-modal",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    DatePickerModule,
  ],
  templateUrl: "./create-ticket-modal.html",
})
export class CreateTicketModalComponent implements OnInit {
  private ticketService = inject(TicketService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();
  @Output() ticketCreated = new EventEmitter<void>();

  priorityOptions: { label: string; value: string }[] = [];
  assignedOptions: { label: string; value: string }[] = [];

  defaultEstadoId = "";
  currentUserId = "";
  isSaving = false;

  form = {
    titulo: "",
    descripcion: "",
    prioridad_id: "",
    asignado_id: "",
    fecha_final: null as Date | null,
  };

  async ngOnInit() {
    await this.loadDependencies();
  }

  private async loadDependencies() {
    this.ticketService.getPriorities().subscribe((res: any) => {
      const prioridades = res?.data || res || [];
      this.priorityOptions = prioridades.map((p: any) => ({ label: p.nombre, value: p.id }));
      if (this.priorityOptions.length > 0 && !this.form.prioridad_id) {
        this.form.prioridad_id = this.priorityOptions[0].value;
      }
      this.cdr.detectChanges();
    });

    this.apiService.getStates().subscribe((res: any) => {
      const estados = res?.data || res || [];
      const estadoPendiente = estados.find((e: any) => e.nombre.toLowerCase() === 'pendiente') || estados[0];
      if (estadoPendiente) {
        this.defaultEstadoId = estadoPendiente.id;
      }
      this.cdr.detectChanges();
    });

    const resUsers: any = await this.userService.getAll();
    const usuarios = resUsers?.data || resUsers || [];

    this.assignedOptions = usuarios.map((u: any) => ({
      label: u.nombre_completo || u.username,
      value: u.id
    }));
    this.assignedOptions.unshift({ label: "Sin asignar", value: "" });

    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
    }
    this.cdr.detectChanges();
  }

  private toISODate(value: Date | null) {
    if (!value) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  close() {
    this.closeModal.emit();
  }

  async save() {
    const titulo = this.form.titulo.trim();

    if (!titulo || !this.groupId || !this.defaultEstadoId || !this.currentUserId || !this.form.prioridad_id) {
      console.error("Faltan datos obligatorios:", {
        titulo,
        groupId: this.groupId,
        estadoId: this.defaultEstadoId,
        userId: this.currentUserId,
        prioridadId: this.form.prioridad_id
      });
      return;
    }

    this.isSaving = true;

    const payload = {
      grupo_id: this.groupId,
      titulo: titulo,
      descripcion: this.form.descripcion.trim() || null,
      autor_id: this.currentUserId,
      asignado_id: this.form.asignado_id || null,
      estado_id: this.defaultEstadoId,
      prioridad_id: this.form.prioridad_id,
      fecha_final: this.toISODate(this.form.fecha_final),
    };

    try {
      await this.ticketService.create(payload);
      this.ticketCreated.emit();
      this.resetForm();
      this.close();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving = false;
    }
  }

  private resetForm() {
    this.form = {
      titulo: "",
      descripcion: "",
      prioridad_id: this.priorityOptions.length > 0 ? this.priorityOptions[0].value : "",
      asignado_id: "",
      fecha_final: null,
    };
  }
}