import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    email = '';
    password = '';
    isLoginMode = true;
    errorMessage = '';

    constructor(private auth: AuthService, private router: Router) {}

    onSubmit() {
        if (!this.email || !this.password) {
            this.errorMessage = 'Заполните все поля';
            return;
        }
        const request = this.isLoginMode
            ? this.auth.login(this.email, this.password)
            : this.auth.register(this.email, this.password);
        request.subscribe({
            next: () => this.router.navigate(['/tasks']),
            error: (err) => this.errorMessage = err.error?.message || 'Ошибка'
        });
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.errorMessage = '';
    }
}