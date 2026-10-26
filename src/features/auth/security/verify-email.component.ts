import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { user } from '../../../core/models/authResponse';
import { environment } from '../../../eviroments/enviroments';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-zinc-950 px-6 py-20 text-white">
      <section class="mx-auto max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <a routerLink="/" class="text-xl font-bold">GarageMeet</a>
        <p class="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-400">Protege tu cuenta</p>
        <h1 class="mt-3 text-3xl font-bold">Verifica tu correo</h1>
        <p class="mt-4 text-zinc-300">
          Enviamos un enlace al correo de tu cuenta. Ábrelo y vuelve aquí para continuar.
        </p>

        @if (message()) {
          <p class="mt-6 rounded-xl bg-zinc-800 p-4" role="status">{{ message() }}</p>
        }

        <div class="mt-8 grid gap-3">
          <button type="button" class="rounded-xl bg-blue-600 px-5 py-3 font-semibold disabled:opacity-50"
            [disabled]="loading()" (click)="checkVerification()">
            Ya verifiqué mi correo
          </button>
          <button type="button" class="rounded-xl border border-zinc-700 px-5 py-3 font-semibold disabled:opacity-50"
            [disabled]="loading()" (click)="resend()">
            Reenviar enlace
          </button>
        </div>
      </section>
    </main>
  `
})
export class VerifyEmailComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  message = signal<string | null>(null);

  ngOnInit(): void {
    if (new URLSearchParams(window.location.search).get('verified') === '1') {
      this.checkVerification();
    }
  }

  resend(): void {
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/email/verification-notification`, {}, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.message.set('Enlace enviado. Revisa también tu carpeta de correo no deseado.');
        },
        error: () => {
          this.loading.set(false);
          this.message.set('No pudimos reenviar el enlace todavía. Intenta de nuevo en un minuto.');
        }
      });
  }

  checkVerification(): void {
    this.loading.set(true);
    this.http.post<user>(`${environment.apiUrl}/auth/me`, {}, { headers: this.headers() })
      .subscribe({
        next: (currentUser) => {
          this.loading.set(false);
          this.auth.updateCurrentUser(currentUser);
          if (!currentUser.email_verified) {
            this.message.set('El correo todavía no aparece verificado. Abre el enlace que te enviamos.');
            return;
          }

          if (currentUser.mechanical_workshop && !currentUser.mfa_enabled) {
            this.router.navigateByUrl('/mfa-setup');
          } else if (currentUser.mechanical_workshop) {
            this.router.navigateByUrl('/panel');
          } else {
            this.router.navigateByUrl('/pricing');
          }
        },
        error: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/login');
        }
      });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
