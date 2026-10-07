import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  readonly returnUrl = input<string>('/admin');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly modo = signal<'login' | 'olvide' | 'enviado'>('login');
  protected readonly error = signal('');
  protected readonly verPassword = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly olvideForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected ingresar(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    if (this.auth.login(email, password)) {
      this.router.navigateByUrl(this.returnUrl() || '/admin');
    } else {
      this.error.set('Email o contraseña incorrectos.');
    }
  }

  /** POST /api/v1/auth/forgot-password responde siempre lo mismo, exista o no el email. */
  protected enviarReset(): void {
    if (this.olvideForm.valid) this.modo.set('enviado');
  }
}
