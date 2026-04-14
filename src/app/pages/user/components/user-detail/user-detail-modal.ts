import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";

@Component({
    selector: "app-user-detail-modal",
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, TagModule],
    templateUrl: "./user-detail-modal.html",
})
export class UserDetailModalComponent {
    @Input() visible = false;
    @Input() user: any = null;
    @Output() closeModal = new EventEmitter<void>();

    onHide() {
        this.closeModal.emit();
    }
}