import { Component, inject, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../core/cart.service';
import { OrdersService } from '../core/orders.service';
import { Cliente, precioPack } from '../core/models';
import { CheckoutDialog } from './checkout-dialog';

@Component({
  selector: 'app-cart-panel',
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './cart-panel.html',
  styleUrl: './cart-panel.scss',
})
export class CartPanel {
  protected readonly cart = inject(CartService);
  private readonly orders = inject(OrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly closed = output<void>();
  protected readonly precioPack = precioPack;

  protected checkout(): void {
    this.dialog
      .open<CheckoutDialog, number, Cliente>(CheckoutDialog, { data: this.cart.total(), width: '560px' })
      .afterClosed()
      .subscribe((cliente) => {
        if (!cliente) return;
        const pedido = this.orders.crear(
          cliente,
          this.cart.lines().map((l) => ({ productoId: l.producto.id, packs: l.packs })),
        );
        this.cart.clear();
        this.closed.emit();
        this.snackBar.open(`¡Gracias! Tu pedido #${pedido.id} fue confirmado.`, 'OK', { duration: 5000 });
      });
  }
}
