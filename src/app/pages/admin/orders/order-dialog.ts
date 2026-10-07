import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdersService } from '../../../core/orders.service';
import { ESTADOS_ENVIO, EstadoEnvio, etiquetaEnvio, totalUnidades } from '../../../core/models';
import { ConfirmDialog, ConfirmData } from '../../../shared/confirm-dialog';
import { CLASE_ENVIO, CLASE_ESTADO } from './order-pills';

@Component({
  selector: 'app-order-dialog',
  imports: [CurrencyPipe, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatButtonToggleModule, MatDividerModule],
  templateUrl: './order-dialog.html',
  styleUrl: './order-dialog.scss',
})
export class OrderDialog {
  private readonly id = inject<number>(MAT_DIALOG_DATA);
  private readonly orders = inject(OrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly pedido = computed(() => this.orders.buscar(this.id)!);
  protected readonly estadosEnvio = ESTADOS_ENVIO;
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly claseEnvio = CLASE_ENVIO;
  protected readonly etiquetaEnvio = etiquetaEnvio;
  protected readonly totalUnidades = totalUnidades;

  protected cambiarEnvio(estado: EstadoEnvio): void {
    this.orders.setEstadoEnvio([this.id], estado);
    this.snackBar.open(`Pedido #${this.id} → ${etiquetaEnvio(estado)}`, undefined, { duration: 2000 });
  }

  /** Solo para cerrar un pedido pagado tras un hecho externo (ej. contracargo perdido). No toca el stock. */
  protected cerrar(estado: 'Cancelado' | 'Reembolsado'): void {
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          titulo: `Marcar pedido #${this.id} como ${estado}`,
          mensaje:
            'Usalo solo para registrar un hecho externo (ej. contracargo perdido o reembolso hecho desde Mercado Pago). ' +
            'No se puede revertir y no devuelve stock: si corresponde, hacé un ajuste manual.',
          confirmar: `Marcar como ${estado}`,
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.orders.cerrar(this.id, estado);
        this.snackBar.open(`Pedido #${this.id} marcado como ${estado}`, undefined, { duration: 2500 });
      });
  }
}
