import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, InputTextModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {}