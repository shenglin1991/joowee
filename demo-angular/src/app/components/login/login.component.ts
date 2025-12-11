import { Component, signal, inject, effect, computed } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthResourceService } from '../../services/auth.resource.service';
import { LoginRequest } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // Injection de dépendances moderne
  private authService = inject(AuthResourceService);
  private readonly router = inject(Router);

  // Signals pour l'état du composant
  isLoading = signal(false);
  errorMessage = signal('');

  // FormGroup typé
  loginForm = new FormGroup<{ username: FormControl<string>; password: FormControl<string> }>({
    username: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
  });

  // Computed pour suivre le statut de login
  private loginStatus = computed(() => this.authService.loginStatus);

  constructor() {
    // Effect dans le constructor pour réagir aux changements de statut
    effect(() => {
      const status = this.loginStatus();

      if (status.error) {
        this.errorMessage.set('Identifiants invalides');
        this.isLoading.set(false);
      }

      if (status.value) {
        this.router.navigate(['/chat']);
      }

      if (status.isLoading) {
        this.isLoading.set(true);
        this.errorMessage.set('');
      } else {
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.getRawValue();
      this.authService.login(credentials);
    }
  }

  get username() {
    return this.loginForm.controls.username;
  }

  get password() {
    return this.loginForm.controls.password;
  }
}
