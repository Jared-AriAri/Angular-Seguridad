import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: "./home.page.html",
})
export class HomePage {}