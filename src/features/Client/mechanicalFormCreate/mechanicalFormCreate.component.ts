import { Component, signal, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AutoComplete } from "primeng/autocomplete";
import { LocationsService } from '../../search/services/locations.service';
import { LocationOption } from '../../search/models/location.model';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { InputMask } from 'primeng/inputmask';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CreateMechanicalWorkshopService } from './services/createMechanicalWorkshop.service';
interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}
@Component({
  selector: 'app-mechanical-form-create',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AutoComplete, FormsModule, InputTextModule, InputMask, Toast],
  templateUrl: './mechanicalFormCreate.component.html',
  styleUrls: ['./mechanicalFormCreate.component.css'],
  providers: [MessageService]
})
export class MechanicalFormCreateComponent implements OnInit {
  mechanicalForm!: FormGroup;
  isLoading = signal(false);
  states = signal<any[]>([]);
  items: LocationOption[] = [];
  selectedLocation: LocationOption | null = null;
  authservice = inject(AuthService);
  locationsService = inject(LocationsService);
  messageService = inject(MessageService);
  mechanicalService = inject(CreateMechanicalWorkshopService);
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit() {
    this.mechanicalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      cellphone_number: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      municipality_id: [null, [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
      google_maps_link: ['']
    });

  }

  search(event: AutoCompleteCompleteEvent) {
    if (event.query.trim().length < 2) {
      this.items = [];
      return;
    }

    this.locationsService.search(event.query).subscribe(locations => {
      this.items = locations;
    });
  }

  onLocationSelected(location: LocationOption) {
    this.selectedLocation = location;
    this.mechanicalForm.patchValue({
      municipality_id: location.type === 'municipality' ? location.id : null
    });
  }

  onLocationCleared() {
    this.selectedLocation = null;
    this.mechanicalForm.patchValue({ municipality_id: null });
  }

  createMechanical() {
    if (!this.mechanicalForm.valid) {
      this.showErrorMessage('Por favor, corrige los errores en el formulario');
      return;
    }

    if (!this.selectedLocation || this.selectedLocation.type !== 'municipality') {
      this.showErrorMessage('Selecciona una alcaldía o municipio de la lista');
      return;
    }

    const formData = {
      ...this.mechanicalForm.value,
      google_maps_link: this.mechanicalForm.value.google_maps_link || null
    };

    this.isLoading.set(true);
    this.mechanicalService.create(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showSuccessMessage('Taller creado exitosamente');
        this.showInfoMessage('Felicidades ya eres parte de nuestro equipo, que disfrutes tu experiencia con nosotros!!! 🎉🎉🎉');
        this.router.navigate(['/mfa-setup']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showErrorMessage('Error al crear taller');
      }
    });
  }

  // Message helpers
  private showErrorMessage(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail
    });
  }

  private showSuccessMessage(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail
    });
  }

  private showInfoMessage(detail: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail
    });
  }
}
