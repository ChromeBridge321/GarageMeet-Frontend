import { Routes } from '@angular/router';
import { PresentationComponent } from '../features/Client/Template/presentation.component';
import { PruebasComponent } from '../features/pruebas/pruebas.component';
import { SearchComponent } from '../features/search/search.component';
import { LoginComponent } from '../features/auth/login/login.component';
import { RegisterComponent } from '../features/auth/register/register.component';
import { roleGuard } from '../core/guards/Role.guard';
import { guestGuard } from '../core/guards/guest.guard';
import { authGuard } from '../core/guards/authGuard.guard';
import { SubscriptionPlansComponent } from '../features/Client/SubscriptionPlans/SubscriptionPlans.component';
import { MechanicalFormCreateComponent } from '../features/Client/mechanicalFormCreate/mechanicalFormCreate.component';
import { VerifyEmailComponent } from '../features/auth/security/verify-email.component';
import { MfaSetupComponent } from '../features/auth/security/mfa-setup.component';

export const routes: Routes = [
  {
    path: '',
    component: PresentationComponent
  },

  {
    path: 'pruebas',
    component: PruebasComponent
  },

  {
    path: 'search',
    component: SearchComponent
  },

  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'panel',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadChildren: () => import('../features/Dashboard/dashboard.routes'),
  },
  {
    path: 'pricing',
    component: SubscriptionPlansComponent
  },

  {
    path: 'register-workshop',
    component: MechanicalFormCreateComponent,
    canActivate: [authGuard],
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'mfa-setup',
    component: MfaSetupComponent,
    canActivate: [authGuard],
  },

  {
    path: '**',
    redirectTo: '',

  }
];
