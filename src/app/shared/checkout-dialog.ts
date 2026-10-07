import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Cliente } from '../core/models';

/**
 * Formulario propio del checkout (nombre, teléfono y dirección).
 * DNI y email los entrega el Card Payment Brick de Mercado Pago; acá se piden mientras no esté integrado.
 */
@Component({
  selector: 'app-checkout-dialog',
  imports: [CurrencyPipe, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Datos de envío</h2>
    <form [formGroup]="form" (ngSubmit)="confirmar()">
      <mat-dialog-content class="grid">
        <mat-form-field class="full">
          <mat-label>Nombre y apellido</mat-label>
          <input matInput formControlName="nombre" autocomplete="name" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" autocomplete="tel" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>DNI</mat-label>
          <input matInput formControlName="dni" inputmode="numeric" />
          <mat-hint>Lo va a pedir Mercado Pago</mat-hint>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          <mat-hint>Lo va a pedir Mercado Pago</mat-hint>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>Dirección de entrega</mat-label>
          <textarea matInput formControlName="direccion" rows="2" autocomplete="street-address"></textarea>
          <mat-hint>Calle y número, localidad, provincia y código postal</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <span class="total">Total: {{ total | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</span>
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Pagar (simulado)</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 12px;
    }
    .full {
      grid-column: 1 / -1;
    }
    .total {
      margin-right: auto;
      font-weight: 500;
    }
  `,
})
export class CheckoutDialog {
  protected readonly total = inject<number>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CheckoutDialog, Cliente>);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    telefono: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected confirmar(): void {
    if (this.form.valid) this.ref.close(this.form.getRawValue());
  }
}
