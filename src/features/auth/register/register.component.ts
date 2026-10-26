import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterDTO } from '../models/auth.dto';
import { RegisterService } from '../services/register.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, Toast],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [MessageService]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
 messageService = inject(MessageService);
  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(12),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { confirmPassword, ...userData } = this.registerForm.value;
      const registerData: RegisterDTO = {
        ...userData,
        password_confirmation: confirmPassword
      };

      this.registerService.register(registerData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigateByUrl('/verify-email');
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error:', error);
          this.showErrorMessage('Error al registrar la cuenta. Intenta nuevamente.');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          name: 'El nombre',
          last_name: 'El apellido',
          email: 'El correo',
          password: 'La contraseña',
          confirmPassword: 'La confirmación de contraseña'
        };
        return `${fieldLabels[fieldName]} es requerido`;
      }
      if (field.errors['email']) {
        return 'Formato de correo inválido';
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'password') {
          return `La contraseña debe tener al menos ${minLength} caracteres`;
        }
        return `Debe tener al menos ${minLength} caracteres`;
      }
      if (field.errors['pattern'] && fieldName === 'password') {
        return 'Usa mayúsculas, minúsculas y al menos un número';
      }
      if (field.errors['mismatch']) {
        return 'Las contraseñas no coinciden';
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
