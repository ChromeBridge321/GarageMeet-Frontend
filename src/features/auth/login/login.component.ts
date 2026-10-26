import {  Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginDTO } from '../models/auth.dto';
import { LoginService } from '../services/login.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, Toast],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  requiresMfa = signal(false);
  messageService = inject(MessageService);
  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      mfa_code: ['']
    });
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const raw = this.loginForm.value;
      const credentials: LoginDTO = {
        email: raw.email,
        password: raw.password,
        ...(this.requiresMfa() ? { mfa_code: raw.mfa_code } : {})
      };

      this.loginService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (!response.user.email_verified) {
            this.router.navigateByUrl('/verify-email');
          } else if (response.user.mechanical_workshop && !response.user.mfa_enabled) {
            this.router.navigateByUrl('/mfa-setup');
          } else if (response.user.mechanical_workshop) {
            this.router.navigateByUrl('/panel');
          } else {
            this.router.navigateByUrl('/pricing');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error?.error?.code === 'mfa_required') {
            this.requiresMfa.set(true);
            this.loginForm.get('mfa_code')?.setValidators([Validators.required]);
            this.loginForm.get('mfa_code')?.updateValueAndValidity();
            this.showErrorMessage('Ingresa el código de tu aplicación de autenticación o un código de recuperación.');
            return;
          }
          this.showErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        const labels: Record<string, string> = {
          email: 'El correo',
          password: 'La contraseña',
          mfa_code: 'El código de seguridad'
        };
        return `${labels[fieldName]} es requerido`;
      }
      if (field.errors['email']) {
        return 'Formato de correo inválido';
      }
    }
    return null;
  }

  private showErrorMessage(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail
    });
  }
}
