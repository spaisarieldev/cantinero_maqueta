import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogService } from '../../../core/catalog.service';
import { Producto } from '../../../core/models';

/** POST /api/v1/productos/{id}/movimientos-stock — solo motivos creados por el admin. */
@Component({
  selector: 'app-stock-dialog',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Ajustar stock</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <p class="current">
          <strong>{{ actual().nombre }}</strong> · stock actual: <strong>{{ actual().stock }}</strong> unidades
        </p>

        <mat-button-toggle-group formControlName="tipo" class="tipo">
          <mat-button-toggle value="ingreso"><mat-icon>add</mat-icon> Ingreso</mat-button-toggle>
          <mat-button-toggle value="egreso"><mat-icon>remove</mat-icon> Egreso</mat-button-toggle>
        </mat-button-toggle-group>

        <div class="row">
          <mat-form-field>
            <mat-label>Motivo</mat-label>
            <mat-select formControlName="motivoId">
              @for (m of catalog.motivosManuales; track m.id) {
                <mat-option [value]="m.id">{{ m.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error>Elegí un motivo</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Cantidad (unidades)</mat-label>
            <input matInput type="number" min="1" step="1" formControlName="cantidad" />
            @if (form.hasError('excedeStock')) {
              <mat-hint class="err">No puede superar el stock actual</mat-hint>
            }
            <mat-error>Entero mayor a 0</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field class="full">
          <mat-label>Observación</mat-label>
          <input matInput formControlName="observacion" />
        </mat-form-field>

        <p class="result">Stock resultante: <strong>{{ resultante() }}</strong> unidades</p>

        @if (historial().length) {
          <h3>Últimos movimientos</h3>
          <ul class="history">
            @for (m of historial(); track m.id) {
              <li>
                <span>{{ m.fecha | date: 'dd/MM HH:mm' }}</span>
                <span>{{ catalog.motivoNombre(m.motivoId) }}{{ m.pedidoId ? ' #' + m.pedidoId : '' }}</span>
                <span [class.neg]="m.cantidad < 0">{{ m.cantidad > 0 ? '+' : '' }}{{ m.cantidad }}</span>
              </li>
            }
          </ul>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button class="primary" type="submit" [disabled]="form.invalid">Registrar movimiento</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .current { margin-top: 0; }
    .tipo { margin-bottom: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full { width: 100%; }
    .result { margin: 0 0 8px; }
    .err { color: var(--mat-sys-error); }
    h3 { font: var(--mat-sys-title-small); margin: 16px 0 4px; }
    .history { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; }
    .history li { display: grid; grid-template-columns: 90px 1fr 60px; padding: 4px 0; border-bottom: 1px solid #eee; }
    .history li span:last-child { text-align: right; color: #1d5a33; font-weight: 500; }
    .history li span.neg { color: #8a1c1c; }
  `,
})
export class StockDialog {
  private readonly producto = inject<Producto>(MAT_DIALOG_DATA);
  protected readonly catalog = inject(CatalogService);
  private readonly ref = inject(MatDialogRef<StockDialog>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly actual = computed(() => this.catalog.buscar(this.producto.id) ?? this.producto);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      tipo: ['ingreso' as 'ingreso' | 'egreso'],
      motivoId: [null as unknown as number, Validators.required],
      cantidad: [null as unknown as number, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      observacion: [''],
    },
    { validators: (g: AbstractControl): ValidationErrors | null => this.validarEgreso(g) },
  );

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly resultante = computed(() => {
    const { tipo, cantidad } = this.valores();
    const n = Number(cantidad) || 0;
    return this.actual().stock + (tipo === 'egreso' ? -n : n);
  });

  protected readonly historial = computed(() =>
    this.catalog
      .historialStock()
      .filter((m) => m.productoId === this.producto.id)
      .slice(-5)
      .reverse(),
  );

  protected guardar(): void {
    if (this.form.invalid) return;
    const { tipo, motivoId, cantidad, observacion } = this.form.getRawValue();
    const n = Number(cantidad);
    this.catalog.ajustarStock(this.producto.id, motivoId, tipo === 'egreso' ? -n : n, observacion);
    this.snackBar.open('Movimiento de stock registrado', undefined, { duration: 2000 });
    this.ref.close(true);
  }

  private validarEgreso(g: AbstractControl): ValidationErrors | null {
    const { tipo, cantidad } = g.value;
    return tipo === 'egreso' && Number(cantidad) > (this.producto?.stock ?? 0) ? { excedeStock: true } : null;
  }
}
