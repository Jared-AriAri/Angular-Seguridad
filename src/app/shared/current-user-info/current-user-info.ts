import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TagModule } from "primeng/tag";
import { AuthContextService } from "../auth-context.service";
import type { UserItem } from "../../pages/user/user.model";

@Component({
  selector: "app-current-user-info",
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TagModule],
  templateUrl: "./current-user-info.html",
})
export class CurrentUserInfoComponent implements OnInit {
  currentUser: UserItem | null = null;
  visible = false;

  constructor(private authContext: AuthContextService) {}

  ngOnInit() {
    this.currentUser = this.authContext.getCurrentUser();
  }

  open() {
    this.visible = true;
  }

  close() {
    this.visible = false;
  }
}