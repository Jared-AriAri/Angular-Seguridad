import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";

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

type GroupMember = {
  username: string;
  fullName: string;
  email: string;
};

const USERS_STORAGE_KEY = "demo_users";
const GROUP_MEMBERS_STORAGE_KEY = "group_members";

@Component({
  selector: "app-group-members-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, SelectModule, ButtonModule],
  templateUrl: "./group-members-modal.html"
})
export class GroupMembersModalComponent {
  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();

  users: StoredUser[] = [];
  members: GroupMember[] = [];
  userOptions: { label: string; value: string }[] = [];
  selectedUsername = "";

  ngOnChanges() {
    this.loadUsers();
    this.loadMembers();
  }

  close() {
    this.closeModal.emit();
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
      this.userOptions = this.users.map((user) => ({
        label: `${user.fullName || user.username} (${user.email})`,
        value: user.username
      }));
    } catch {
      this.users = [];
      this.userOptions = [];
    }
  }

  loadMembers() {
    try {
      const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      this.members = Array.isArray(all[this.groupId]) ? all[this.groupId] : [];
    } catch {
      this.members = [];
    }
  }

  saveMembers(nextMembers: GroupMember[]) {
    const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[this.groupId] = nextMembers;
    localStorage.setItem(GROUP_MEMBERS_STORAGE_KEY, JSON.stringify(all));
    this.members = nextMembers;
  }

  addMember() {
    if (!this.selectedUsername || !this.groupId) return;

    const exists = this.members.some((member) => member.username === this.selectedUsername);
    if (exists) {
      this.selectedUsername = "";
      return;
    }

    const user = this.users.find((u) => u.username === this.selectedUsername);
    if (!user) return;

    const nextMembers = [
      ...this.members,
      {
        username: user.username,
        fullName: user.fullName,
        email: user.email
      }
    ];

    this.saveMembers(nextMembers);
    this.selectedUsername = "";
  }

  removeMember(username: string) {
    const nextMembers = this.members.filter((member) => member.username !== username);
    this.saveMembers(nextMembers);
  }
}