import { Component, OnInit } from "@angular/core";
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

import { MessageService, ConfirmationService } from "primeng/api";

import { GroupService } from "./group.service";
import type { Group } from "./group.model";

type FormState = {
  id: string | null;
  name: string;
  description: string;
  status: "active" | "inactive";
};

@Component({
  selector: "app-group-page",
  standalone: true,
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./group.page.html",
})
export class GroupPage implements OnInit {
  groups: Group[] = [];
  loading = true;
  q = "";

  dialogOpen = false;
  viewOpen = false;

  selected: Group | null = null;

  form: FormState = {
    id: null,
    name: "",
    description: "",
    status: "active",
  };

  constructor(
    private svc: GroupService,
    private toast: MessageService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit() {
    this.svc.seedIfEmpty();
    this.svc.groups$.subscribe((list) => {
      this.groups = list;
      this.loading = false;
    });
  }

  openCreate() {
    this.form = {
      id: null,
      name: "",
      description: "",
      status: "active",
    };
    this.dialogOpen = true;
  }

  openEdit(g: Group) {
    this.form = {
      id: g.id,
      name: g.name,
      description: g.description,
      status: g.status,
    };
    this.dialogOpen = true;
  }

  openView(g: Group) {
    this.selected = g;
    this.viewOpen = true;
  }

  save() {
    const name = this.form.name.trim();

    if (!name) {
      this.toast.add({
        severity: "warn",
        summary: "Falta información",
        detail: "El nombre es obligatorio.",
      });
      return;
    }

    const saved = this.svc.upsert(
      {
        name,
        description: this.form.description || "",
        status: this.form.status,
      },
      this.form.id || undefined
    );

    this.toast.add({
      severity: "success",
      summary: this.form.id ? "Actualizado" : "Creado",
      detail: saved.name,
    });

    this.dialogOpen = false;
  }

  askDelete(g: Group) {
    this.confirm.confirm({
      header: "Eliminar grupo",
      message: '¿Seguro que deseas eliminar "' + g.name + '"?',
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.svc.remove(g.id);
        this.toast.add({
          severity: "success",
          summary: "Eliminado",
          detail: g.name,
        });
      },
    });
  }

  statusLabel(status: Group["status"]) {
    return status === "active" ? "Activo" : "Inactivo";
  }

  statusSeverity(status: Group["status"]) {
    return status === "active" ? "success" : "secondary";
  }
}