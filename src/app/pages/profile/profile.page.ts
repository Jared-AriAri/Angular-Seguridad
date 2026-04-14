import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule, registerLocaleData } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { AuthService } from "../../core/services/auth.service";
import { TicketService } from "../../core/services/ticket.service";
import { TicketListComponent } from "../tickets/ticket-list/ticket-list";
import type { Ticket } from "../../core/models/ticket.model";
import { filter, take } from "rxjs";
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TicketListComponent,
    TagModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: "./profile.page.html",
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  tickets: Ticket[] = [];
  loading = true;

  ngOnInit() {
    this.authService.initialized$.pipe(
      filter(init => init === true),
      take(1)
    ).subscribe(async () => {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const u = currentUser as any;

        this.user = {
          ...u,
          fullName: u.fullName || u.nombre_completo,
          phone: u.phone || u.telefono,
          address: u.address || u.direccion,
          birthDate: u.birthDate || u.fecha_nacimiento,
          createdAt: this.formatSafeDate(u.creado_en || u.createdAt || u.created_at),
          permissions: u.permissions || u.permisos_globales || []
        };

        await this.loadMyTickets();
      }
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private formatSafeDate(value: any): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  async loadMyTickets() {
    try {
      const res: any = await this.ticketService.getAll();
      const allTickets = res?.data || res || [];
      const currentUserId = this.user?.id;

      if (currentUserId) {
        this.tickets = allTickets.filter((t: any) =>
          t.autor_id === currentUserId || t.asignado_id === currentUserId
        );
      }
    } catch (error) {
      this.tickets = [];
    }
  }

  get totalTickets() {
    return this.tickets.length;
  }

  get openTickets() {
    return this.tickets.filter(t => {
      const s = t.estados?.nombre?.toLowerCase();
      return s !== "finalizado" && s !== "completado";
    }).length;
  }

  get permissionLevelLabel() {
    const perms = this.user?.permissions || [];
    const count = perms.length;

    if (count >= 15) return "Acceso Total";
    if (count > 8) return "Acceso Medio";
    if (count > 0) return "Acceso Básico";
    return "Sin Permisos";
  }

  close() {
    window.history.back();
  }
}