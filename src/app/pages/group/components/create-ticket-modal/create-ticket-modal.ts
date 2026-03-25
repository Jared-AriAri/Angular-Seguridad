import { Component, EventEmitter, Input, Output, OnChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { TicketService } from "../../ticket.service";
import type { TicketPriority } from "../../ticket.model";
import {
  ADMIN_DEFAULT_PERMISSIONS,
  normalizePermissions,
} from "../../../user/user.model";
import { AuthContextService } from "../../../../shared/auth-context.service";

type StoredUser = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
  permissions?: string[];
  role?: string;
};

const USERS_STORAGE_KEY = "demo_users";

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
export class CreateTicketModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();

  priorityOptions = [
    { label: "Highest", value: "highest" },
    { label: "High", value: "high" },
    { label: "Medium High", value: "medium_high" },
    { label: "Medium", value: "medium" },
    { label: "Medium Low", value: "medium_low" },
    { label: "Low", value: "low" },
    { label: "Lowest", value: "lowest" },
  ];

  assignedOptions: { label: string; value: string }[] = [];

  form: {
    title: string;
    description: string;
    priority: TicketPriority;
    assignedTo: string;
    dueDate: Date | null;
  } = {
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "",
      dueDate: null,
    };

  constructor(
    private ticketService: TicketService,
    private authContext: AuthContextService
  ) { }

  ngOnChanges() {
    this.loadUsers();
  }

  private toISODate(value: Date | null) {
    if (!value) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private isAdminByPermissions(user: StoredUser) {
    const permissions = normalizePermissions(user);
    return ADMIN_DEFAULT_PERMISSIONS.every((permission) =>
      permissions.includes(permission)
    );
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];

      const adminUsers = users.filter((user) => this.isAdminByPermissions(user));

      this.assignedOptions = adminUsers.map((user) => ({
        label: user.fullName?.trim() || user.username,
        value: user.username,
      }));
    } catch {
      this.assignedOptions = [];
    }
  }

  close() {
    this.closeModal.emit();
  }

  save() {
    const title = this.form.title.trim();
    const description = this.form.description.trim();

    if (!title || !this.groupId) {
      return;
    }

    const currentUser =
      this.authContext.getCurrentUser()?.username || "unknown";

    this.ticketService.create({
      id: crypto.randomUUID(),
      title,
      description,
      status: "pending",
      priority: this.form.priority,
      assignedTo: this.form.assignedTo,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      dueDate: this.toISODate(this.form.dueDate),
      groupId: this.groupId,
      comments: [],
      history: [],
    });

    this.form = {
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "",
      dueDate: null,
    };

    this.close();
  }
}