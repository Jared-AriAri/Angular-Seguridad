import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { AuthService } from "../../../../core/services/auth.service";
import { UserService } from "../../../../core/services/user.service";
import { GroupService } from "../../../../core/services/group.service";

@Component({
  selector: "app-group-members-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, SelectModule, ButtonModule, TagModule, TooltipModule],
  templateUrl: "./group-members-modal.html",
})
export class GroupMembersModalComponent implements OnChanges {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() groupId = "";
  @Output() closeModal = new EventEmitter<void>();

  members: any[] = [];
  userOptions: any[] = [];
  selectedUserId = "";
  canManageGroupMembers = false;

  async ngOnChanges(changes: SimpleChanges) {
    if (this.visible && this.groupId) {
      this.checkPermissions();
      await this.loadData();
    }
  }

  checkPermissions() {
    this.canManageGroupMembers =
      this.auth.hasPermission("group:manage") ||
      this.auth.hasPermission("user:create") ||
      this.auth.hasPermission("group:edit");
  }

  async loadData() {
    try {
      const [allUsersRes, groupMembersRes]: any[] = await Promise.all([
        this.userService.getAll(),
        this.groupService.getMembers(this.groupId)
      ]);

      const rawUsers = allUsersRes?.data || allUsersRes || [];
      const rawMembers = groupMembersRes?.data || groupMembersRes || [];

      this.members = rawMembers.map((m: any) => ({
        ...m,
        usuario_id: m.usuario_id || m.id,
        display_name: m.nombre_completo || m.fullName || m.username || 'Usuario',
        display_email: m.email || 'Sin email'
      }));

      const currentMemberIds = new Set(this.members.map(m => m.usuario_id));

      this.userOptions = rawUsers
        .filter((u: any) => !currentMemberIds.has(u.id))
        .map((u: any) => ({
          label: `${u.nombre_completo || u.username} (${u.email})`,
          value: u.id
        }));

      this.cdr.detectChanges();
    } catch (e) {
      this.members = [];
      this.userOptions = [];
      this.cdr.detectChanges();
    }
  }

  async addMember() {
    if (!this.selectedUserId) return;
    try {
      await this.groupService.addMember(this.groupId, this.selectedUserId);
      this.selectedUserId = "";
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async removeMember(userId: string) {
    try {
      await this.groupService.removeMember(this.groupId, userId);
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
  }

  close() {
    this.selectedUserId = "";
    this.closeModal.emit();
  }
}