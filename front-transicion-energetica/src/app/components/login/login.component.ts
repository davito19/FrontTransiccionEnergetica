import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['admin@correo.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'forbidden') {
      this.errorMessage.set('Solo usuarios ADMIN pueden ingresar al dashboard.');
    }
    if (reason === 'expired') {
      this.errorMessage.set('Tu sesion expiro. Inicia sesion nuevamente.');
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        if (session.role !== 'ADMIN') {
          this.authService.logout();
          this.errorMessage.set('Este usuario no tiene permisos de administrador.');
          this.loading.set(false);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Credenciales invalidas.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
