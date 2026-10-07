import { Component, input, signal } from '@angular/core';

/** Muestra una imagen; si todavía no existe el archivo, muestra un recuadro con la descripción. */
@Component({
  selector: 'app-image-slot',
  template: `
    @if (!failed()) {
      <img [src]="src()" [alt]="label()" (error)="failed.set(true)" />
    } @else {
      <div class="placeholder">{{ label() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: var(--img-fit, cover);
      object-position: var(--img-position, center);
      display: block;
    }
    .placeholder {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px;
      border: 1px dashed rgba(0, 0, 0, 0.35);
      background: var(--placeholder-bg, #e2d5bb);
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.85rem;
    }
  `,
})
export class ImageSlot {
  readonly src = input.required<string>();
  readonly label = input('');
  protected readonly failed = signal(false);
}
