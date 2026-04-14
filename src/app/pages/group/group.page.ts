import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { filter, take } from "rxjs";

import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { ToolbarModule } from "primeng/toolbar";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { MessageService, ConfirmationService } from "primeng/api";

import { GroupService } from "../../core/services/group.service";
import { AuthService } from "../../core/services/auth.service";
import { Group } from "../../core/models/group.model";
import { Permission } from "../../core/models/user.model";

import { GroupMembersModalComponent } from "./components/group-members-modal/group-members-modal";

@Component({
    selector: "app-group",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        ToolbarModule,
        InputTextModule,
        TagModule,
        DialogModule,
        TooltipModule,
        ToastModule,
        ConfirmDialogModule,
        GroupMembersModalComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: "./group.page.html",
})
export class GroupPage implements OnInit {
    private groupService = inject(GroupService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    groups: Group[] = [];
    loading: boolean = true;
    dialogOpen: boolean = false;

    memberModalVisible: boolean = false;
    selectedGroupIdForMembers: string = "";
    form: Partial<Group> = {};

    ngOnInit() {
        this.authService.initialized$.pipe(
            filter(init => init === true),
            take(1)
        ).subscribe(() => {
            if (this.hasPermission("group:view")) {
                this.loadGroups();
            } else {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async loadGroups() {
        this.loading = true;
        try {
            const currentUser = this.authService.getCurrentUser();
            const canManage = this.hasPermission("group:create") ||
                this.hasPermission("group:edit") ||
                this.hasPermission("group:delete");

            let res: any;
            if (canManage) {
                res = await this.groupService.getAll();
            } else if (currentUser?.id) {
                res = await this.groupService.getMyGroups(currentUser.id);
            }
            this.groups = res?.data || res || [];
        } catch (error) {
            this.groups = [];
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    hasPermission(permission: string) {
        return this.authService.hasPermission(permission as Permission);
    }

    openMembers(groupId: string) {
        this.selectedGroupIdForMembers = groupId;
        this.memberModalVisible = true;
        this.cdr.detectChanges();
    }

    openGroup(group: Group) {
        this.router.navigate(['/app/group', group.id]);
    }

    openCreate() {
        this.form = { nombre: '', descripcion: '' };
        this.dialogOpen = true;
    }

    openEdit(group: Group) {
        this.form = { ...group };
        this.dialogOpen = true;
    }

    async save() {
        if (!this.form.nombre?.trim()) return;
        try {
            if (this.form.id) {
                await this.groupService.update(this.form.id, this.form);
            } else {
                const user = this.authService.getCurrentUser();
                this.form.creador_id = user?.id;
                await this.groupService.create(this.form);
            }
            this.dialogOpen = false;
            await this.loadGroups();
        } catch (error) {
            this.messageService.add({ severity: 'error', detail: 'No se pudo guardar' });
        }
    }

    askDelete(group: Group) {
        this.confirmationService.confirm({
            message: `¿Borrar "${group.nombre}"?`,
            accept: async () => {
                try {
                    await this.groupService.remove(group.id);
                    await this.loadGroups();
                } catch (error) {
                    this.messageService.add({ severity: 'error', detail: 'Error al eliminar' });
                }
            }
        });
    }
}