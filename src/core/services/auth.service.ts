import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthResponse, user } from '../models/authResponse';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  router = inject(Router);
  private readonly authState = signal<AuthResponse | null>(null);
   public token = computed(() => {
    // Prefer token in authState, fallback to extract from stored response
    if (this.authState()?.access_token) {
      return this.authState()?.access_token;
    }
    // Extract token from stored AuthResponse
    const storedResponse = this.getSecureStorage('authResponse');
    return storedResponse?.access_token || sessionStorage.getItem('authToken');
  });
  public isLoggedIn = computed(() => !!this.token());
  //public currentUser = computed(() => this.authState());
  // Computed signals para acceso reactivo a datos específicos
  public user = computed(() => this.getUserData());
  public mechanicalWorkshop = computed(() => this.getMechanicalWorkshopData());
  public isWorkshopOwner = computed(() => this.hasMechanicalWorkshop());

  // Método para obtener el token actual
  public getToken(): string | null {
    return this.token();
  }

  // Método para obtener los datos de autenticación completos
  public getAuthData(): AuthResponse | null {
    return this.authState();
  }

  // Método para verificar si el token ha expirado (si tienes expires_in)
  public isTokenExpired(): boolean {
    const authData = this.getAuthData();
    if (!authData || !authData.expires_in) return false;

    // Implementar lógica de expiración si es necesario
    // Por ahora retorna false
    return false;
  }

  // Método para obtener datos del usuario
  public getUserData() {
    // Preferir datos del estado en memoria, fallback a almacenamiento
    const authStateUser = this.authState()?.user;
    if (authStateUser) {
      // Retornar solo id y email del estado en memoria
      return {
        id: authStateUser.id,
        email: authStateUser.email
      };
    }

    // Fallback a almacenamiento (ya filtrado)
    return this.getSecureStorage('userData');
  }

  // Método para obtener el tipo de usuario
  public getUserType(): string | null {
    const authStateUser = this.authState()?.user;
    return authStateUser?.type_user || null;
  }

  // Método para obtener datos del taller mecánico
  public getMechanicalWorkshopData() {
    // Preferir datos del estado en memoria, fallback a almacenamiento
    return this.authState()?.user?.mechanical_workshop || this.getSecureStorage('mechanicalWorkshopData');
  }

  // Método para verificar si el usuario tiene taller mecánico
  public hasMechanicalWorkshop(): boolean {
    const workshopData = this.getMechanicalWorkshopData();
    return !!workshopData;
  }

  // Método para obtener el ID del usuario
  public getUserId(): number | null {
    const userData = this.getUserData();
    return userData?.id || null;
  }

  // Método para obtener el email del usuario
  public getUserEmail(): string | null {
    const userData = this.getUserData();
    return userData?.email || null;
  }

  // Método para obtener el ID del taller mecánico
  public getWorkshopId(): number | null {
    const workshopData = this.getMechanicalWorkshopData();
    return workshopData?.id || null;
  }

  // Método para obtener el nombre del taller mecánico
  public getWorkshopName(): string | null {
    const workshopData = this.getMechanicalWorkshopData();
    return workshopData?.name || null;
  }
  // Inicializar desde almacenamiento
  constructor() {
    // Load stored AuthResponse on initialization
    const storedResponse = this.getSecureStorage('authResponse');

    if (storedResponse) {
      // Restore the complete AuthResponse from storage
      this.authState.set(storedResponse);
    }
  }  // Métodos públicos
  setAuthState(response: AuthResponse): void {
    // Store full response in memory
    this.authState.set(response);

    // Store the complete AuthResponse in sessionStorage
    this.setSecureStorage('authResponse', response);

    // Store token separately for easy access
    sessionStorage.setItem('authToken', response.access_token);

    // Store user data separately (only id and email)
    if (response.user) {
      const userData = {
        id: response.user.id,
        email: response.user.email
      };
      this.setSecureStorage('userData', userData);
    }

    // Store mechanical workshop data separately (if exists)
    if (response.user?.mechanical_workshop) {
      this.setSecureStorage('mechanicalWorkshopData', response.user.mechanical_workshop);
    }
  }

  updateCurrentUser(user: user): void {
    const current = this.authState();
    if (!current) return;

    this.setAuthState({ ...current, user });
  }


  logout(): void {
    this.authState.set(null);
    sessionStorage.removeItem('authToken');
    this.clearSecureStorage('authResponse');
    this.clearSecureStorage('userData');
    this.clearSecureStorage('mechanicalWorkshopData');
    this.router.navigate(['/login']);
  }

  // Almacenamiento seguro (abstracción)
  private setSecureStorage(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  private getSecureStorage(key: string): any {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private clearSecureStorage(key: string): void {
    sessionStorage.removeItem(key);
  }
}
