import type { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    console.warn('Acceso denegado: Usuario no autenticado');
    return false;
  }

  if (!authService.hasMechanicalWorkshop()) {
    router.navigate(['/register-workshop']);
    return false;
  }

  return true;
};
