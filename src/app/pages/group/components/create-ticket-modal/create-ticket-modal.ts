import { Component, EventEmitter, Input, Output, OnChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { TicketService } from "../../ticket.service";
import type { TicketPriority } from "../../ticket.model";

type StoredUser = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
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
    ButtonModule
  ],
  templateUrl: "./create-ticket-modal.html"
})
export class CreateTicketModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();

  priorityOptions = [
    { label: "Alta", value: "alta" },
    { label: "Media", value: "media" },
    { label: "Baja", value: "baja" }
  ];

  assignedOptions: { label: string; value: string }[] = [];

  form: {
    title: string;
    description: string;
    priority: TicketPriority;
    assignedTo: string;
    dueDate: string;
  } = {
    title: "",
    description: "",
    priority: "media",
    assignedTo: "",
    dueDate: ""
  };

  constructor(private ticketService: TicketService) {}

  ngOnChanges() {
    this.loadUsers();
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];

      this.assignedOptions = users.map((user) => ({
        label: user.fullName?.trim() || user.username,
        value: user.username
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

    this.ticketService.create({
      id: crypto.randomUUID(),
      title,
      description,
      status: "pendiente",
      priority: this.form.priority,
      assignedTo: this.form.assignedTo,
      createdAt: new Date().toISOString(),
      dueDate: this.form.dueDate || null,
      groupId: this.groupId,
      comments: [],
      history: []
    });

    this.form = {
      title: "",
      description: "",
      priority: "media",
      assignedTo: "",
      dueDate: ""
    };

    this.close();
  }
}