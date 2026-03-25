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
  permissions?: string[];
};

type GroupMember = {
  username: string;
  fullName: string;
  email: string;
};

const USERS_STORAGE_KEY = "demo_users";
const GROUP_MEMBERS_STORAGE_KEY = "group_members";

const CURRENT_USER_JSON_KEYS = [
  "currentUser",
  "user",
  "sessionUser",
  "current_user",
  "auth_user",
  "session_user",
  "logged_user",
] as const;

const CURRENT_USER_DIRECT_KEYS = [
  "currentUsername",
  "username",
  "loggedUsername",
] as const;

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

  canViewGroupMembers = false;
  canManageGroupMembers = false;

  ngOnChanges(changes: SimpleChanges) {
    const visibleChanged = !!changes["visible"];
    const groupChanged = !!changes["groupId"];

    if ((visibleChanged && this.visible) || groupChanged) {
      this.loadUsers();
      this.loadMembers();
      this.resolveAccess();
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

  private getCurrentUsername(): string | null {
    for (const key of CURRENT_USER_DIRECT_KEYS) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value.trim();
    }

    for (const key of CURRENT_USER_JSON_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed?.username) return String(parsed.username).trim();
      } catch { }
    }

    return null;
  }

  private getCurrentUser(): StoredUser | null {
    const currentUsername = this.getCurrentUsername();
    if (!currentUsername) return null;

    return (
      this.users.find(
        (user) =>
          user.username.trim().toLowerCase() ===
          currentUsername.trim().toLowerCase()
      ) || null
    );
  }

  private hasPermission(permission: string): boolean {
    const currentUser = this.getCurrentUser();
    const permissions = Array.isArray(currentUser?.permissions)
      ? currentUser!.permissions
      : [];

    return permissions.includes(permission);
  }

  private isCurrentUserMemberOfThisGroup(): boolean {
    const currentUsername = this.getCurrentUsername();
    if (!currentUsername) return false;

    return this.members.some(
      (member) =>
        member.username.trim().toLowerCase() ===
        currentUsername.trim().toLowerCase()
    );
  }

  private resolveAccess() {
    const canManage =
      this.hasPermission("group:members") || this.hasPermission("group:edit");

    const isMember = this.isCurrentUserMemberOfThisGroup();

    this.canManageGroupMembers = canManage;
    this.canViewGroupMembers = canManage || isMember;

    if (!this.canViewGroupMembers) {
      this.members = [];
      this.userOptions = [];
      this.selectedUsername = "";
    }
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
    if (!this.canManageGroupMembers) {
      this.userOptions = [];
      return;
    }

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
    if (!this.canManageGroupMembers) return;

    try {
      const raw = localStorage.getItem(GROUP_MEMBERS_STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[this.groupId] = nextMembers;
      localStorage.setItem(GROUP_MEMBERS_STORAGE_KEY, JSON.stringify(all));
      this.members = nextMembers;
      this.resolveAccess();
      this.buildUserOptions();
    } catch {
      this.members = nextMembers;
      this.resolveAccess();
      this.buildUserOptions();
    }
  }

  addMember() {
    if (!this.canManageGroupMembers) return;
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
    if (!this.canManageGroupMembers) return;

    const nextMembers = this.members.filter(
      (member) =>
        member.username.trim().toLowerCase() !== username.trim().toLowerCase()
    );

    this.saveMembers(nextMembers);

    if (
      this.selectedUsername.trim().toLowerCase() ===
      username.trim().toLowerCase()
    ) {
      this.selectedUsername = "";
    }
  }
}