import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { user } from '../../../core/models/authResponse';
import { environment } from '../../../eviroments/enviroments';

interface MfaSetupResponse {
  secret: string;
  provisioning_uri: string;
}

@Component({
  selector: 'app-mfa-setup',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <section class="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-400">Seguridad obligatoria</p>
        <h1 class="mt-3 text-3xl font-bold">Activa la verificación en dos pasos</h1>
        <p class="mt-4 text-zinc-300">Los propietarios de talleres necesitan un segundo factor para proteger clientes, ventas y pagos.</p>

        @if (!secret()) {
          <form class="mt-8 grid gap-4" [formGroup]="passwordForm" (ngSubmit)="beginSetup()">
            <label for="current-password">Confirma tu contraseña</label>
            <input id="current-password" type="password" autocomplete="current-password"
              class="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" formControlName="current_password">
            <button class="rounded-xl bg-blue-600 px-5 py-3 font-semibold" [disabled]="loading() || passwordForm.invalid">
              Generar clave de seguridad
            </button>
          </form>
        } @else if (recoveryCodes().length === 0) {
          <div class="mt-8 rounded-xl bg-zinc-950 p-5">
            <p class="font-semibold">1. Agrega la cuenta en tu aplicación autenticadora</p>
            <p class="mt-3 break-all font-mono text-sm text-blue-300">{{ secret() }}</p>
            <details class="mt-3 text-sm text-zinc-400">
              <summary>Mostrar URI de configuración</summary>
              <p class="mt-2 break-all">{{ provisioningUri() }}</p>
            </details>
          </div>
          <form class="mt-6 grid gap-4" [formGroup]="codeForm" (ngSubmit)="confirmSetup()">
            <label for="mfa-code">2. Escribe el código de 6 dígitos</label>
            <input id="mfa-code" type="text" inputmode="numeric" autocomplete="one-time-code"
              class="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" formControlName="code">
            <button class="rounded-xl bg-blue-600 px-5 py-3 font-semibold" [disabled]="loading() || codeForm.invalid">
              Confirmar y activar
            </button>
          </form>
        } @else {
          <div class="mt-8 rounded-xl border border-amber-700 bg-amber-950/40 p-5">
            <h2 class="font-bold">Guarda estos códigos de recuperación</h2>
            <p class="mt-2 text-sm text-zinc-300">Sólo se mostrarán una vez. Cada código sirve una sola vez.</p>
            <ul class="mt-4 grid grid-cols-2 gap-2 font-mono">
              @for (code of recoveryCodes(); track code) { <li>{{ code }}</li> }
            </ul>
          </div>
          <button type="button" class="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold" (click)="finish()">
            Continuar al panel
          </button>
        }

        @if (message()) { <p class="mt-5 text-sm text-red-300" role="alert">{{ message() }}</p> }
      </section>
    </main>
  `
})
export class MfaSetupComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  message = signal<string | null>(null);
  secret = signal<string | null>(null);
  provisioningUri = signal<string | null>(null);
  recoveryCodes = signal<string[]>([]);
  passwordForm = this.fb.group({ current_password: ['', Validators.required] });
  codeForm = this.fb.group({ code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]] });

  beginSetup(): void {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    this.message.set(null);
    this.http.post<MfaSetupResponse>(`${environment.apiUrl}/auth/mfa/setup`, this.passwordForm.getRawValue(), { headers: this.headers() })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.secret.set(response.secret);
          this.provisioningUri.set(response.provisioning_uri);
        },
        error: () => {
          this.loading.set(false);
          this.message.set('No pudimos iniciar la configuración. Revisa tu contraseña y que el correo esté verificado.');
        }
      });
  }

  confirmSetup(): void {
    if (this.codeForm.invalid) return;
    this.loading.set(true);
    this.http.post<{ recovery_codes: string[] }>(`${environment.apiUrl}/auth/mfa/confirm`, this.codeForm.getRawValue(), { headers: this.headers() })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.recoveryCodes.set(response.recovery_codes);
        },
        error: () => {
          this.loading.set(false);
          this.message.set('El código no es válido. Espera al siguiente código e intenta de nuevo.');
        }
      });
  }

  finish(): void {
    this.http.post<user>(`${environment.apiUrl}/auth/me`, {}, { headers: this.headers() }).subscribe({
      next: (currentUser) => {
        this.auth.updateCurrentUser(currentUser);
        this.router.navigateByUrl('/panel');
      },
      error: () => this.router.navigateByUrl('/login')
    });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
