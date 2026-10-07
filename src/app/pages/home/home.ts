import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BRANDS } from '../../core/brands';
import { HeroCarousel, HeroSlide } from '../../shared/hero-carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, HeroCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly brands = BRANDS;

  protected readonly slides: HeroSlide[] = [
    {
      src: 'images/hero-productores.png',
      alt: 'Ilustración: una mano corta un racimo de uvas con una tijera de podar. De la tierra al cóctel, productores entrerrianos.',
      caption: 'Productores entrerrianos',
      bg: '#c2d6cb',
    },
    {
      src: 'images/hero-sustentable.png',
      alt: 'Ilustración: una mano sostiene un brote creciendo en tierra. De la tierra al cóctel, compromiso sustentable.',
      caption: 'Compromiso sustentable',
      bg: '#c2d6cb',
    },
    {
      src: 'images/hero-cocteleria.png',
      alt: 'Ilustración: una mano sostiene un trago servido en una sandía con menta. De la tierra al cóctel, coctelería, gastronomía e insumos.',
      caption: 'Coctelería, gastronomía e insumos',
      bg: '#d6c2a7',
    },
  ];

  protected readonly slideIndex = signal(0);
  protected readonly heroBg = computed(() => this.slides[this.slideIndex()].bg);
}
