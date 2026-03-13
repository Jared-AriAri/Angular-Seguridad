import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
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
  templateUrl: "./group-members-modal.html",
})
export class GroupMembersModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();

  users: StoredUser[] = [];
  members: GroupMember[] = [];
  userOptions: { label: string; value: string }[] = [];
  selectedUsername = "";

  ngOnChanges(changes: SimpleChanges) {
    const visibleChanged = !!changes["visible"];
    const groupChanged = !!changes["groupId"];

    if ((visibleChanged && this.visible) || groupChanged) {
      this.loadUsers();
      this.loadMembers();
      this.buildUserOptions();
    }

    if (visibleChanged && !this.visible) {
      this.selectedUsername = "";
    }
  }

  close() {
    this.selectedUsername = "";
    this.closeModal.emit();
  }

  loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      this.users = [];
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

  buildUserOptions() {
    const memberSet = new Set(
      this.members.map((member) => member.username.trim().toLowerCase())
    );

    this.userOptions = this.users
      .filter((user) => !memberSet.has(user.username.trim().toLowerCase()))
      .map((user) => ({
        label: `${user.fullName || user.username} (${user.email})`,
        value: user.username,
      }));
  }

  saveMembers(nextMembers: GroupMember[]) {
    try {
      const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[this.groupId] = nextMembers;
      localStorage.setItem(GROUP_MEMBERS_STORAGE_KEY, JSON.stringify(all));
      this.members = nextMembers;
      this.buildUserOptions();
    } catch {
      this.members = nextMembers;
      this.buildUserOptions();
    }
  }

  addMember() {
    if (!this.selectedUsername || !this.groupId) return;

    const exists = this.members.some(
      (member) =>
        member.username.trim().toLowerCase() ===
        this.selectedUsername.trim().toLowerCase()
    );

    if (exists) {
      this.selectedUsername = "";
      return;
    }

    const user = this.users.find(
      (u) =>
        u.username.trim().toLowerCase() ===
        this.selectedUsername.trim().toLowerCase()
    );

    if (!user) return;

    const nextMembers = [
      ...this.members,
      {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
    ];

    this.saveMembers(nextMembers);
    this.selectedUsername = "";
  }

  removeMember(username: string) {
    const nextMembers = this.members.filter(
      (member) =>
        member.username.trim().toLowerCase() !== username.trim().toLowerCase()
    );

    this.saveMembers(nextMembers);
    if (this.selectedUsername.trim().toLowerCase() === username.trim().toLowerCase()) {
      this.selectedUsername = "";
    }
  }
}