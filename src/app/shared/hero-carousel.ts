import { Component, DestroyRef, OnInit, inject, input, model, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface HeroSlide {
  src: string;
  alt: string;
  caption: string;
  /** Color de fondo de la ilustración, para fundir el hero con la imagen. */
  bg: string;
}

@Component({
  selector: 'app-hero-carousel',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
  host: {
    '(mouseenter)': 'paused.set(true)',
    '(mouseleave)': 'paused.set(false)',
    '(focusin)': 'paused.set(true)',
    '(focusout)': 'paused.set(false)',
    '(keydown.arrowLeft)': 'prev()',
    '(keydown.arrowRight)': 'next()',
    '[style.--interval.ms]': 'interval()',
    role: 'region',
    'aria-roledescription': 'carrusel',
    'aria-label': 'Presentación de Cantinero Entrerriano',
  },
})
export class HeroCarousel implements OnInit {
  readonly slides = input.required<HeroSlide[]>();
  readonly interval = input(6000);
  readonly index = model(0);

  protected readonly paused = signal(false);
  /** Se reinicia para relanzar la animación de la barra de progreso. */
  protected readonly cycle = signal(0);

  private readonly destroyRef = inject(DestroyRef);
  private elapsed = 0;

  ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tick = 100;
    const id = setInterval(() => {
      if (this.paused() || document.hidden) return;
      this.elapsed += tick;
      if (this.elapsed >= this.interval()) this.next();
    }, tick);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  next(): void {
    this.go((this.index() + 1) % this.slides().length);
  }

  prev(): void {
    this.go((this.index() - 1 + this.slides().length) % this.slides().length);
  }

  go(i: number): void {
    this.elapsed = 0;
    this.cycle.update((c) => c + 1);
    this.index.set(i);
  }
}
