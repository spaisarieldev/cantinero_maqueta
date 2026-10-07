export type BrandSlug = 'kumquat' | 'enlatados' | 'bolazo';

/** Identidad visual de cada marca en la tienda. Los datos de la marca vienen de la API. */
export interface Brand {
  slug: BrandSlug;
  marcaId: number;
  name: string;
  tagline: string;
  description: string[];
  image: string;
  /** object-position de la imagen de presentación. */
  imagePosition?: string;
  /** Imagen de logo para el botón redondo de la home y la barra de la marca. */
  logo?: string;
  /** object-position del logo dentro del círculo. */
  logoPosition?: string;
  /** Zoom del logo dentro del círculo (1 = sin recorte extra). */
  logoScale?: number;
  /** Foto de fondo de la presentación; se funde con el color de la marca. */
  background?: string;
  color: string;
  colorSoft: string;
  colorText: string;
}

export const BRANDS: Brand[] = [
  {
    slug: 'kumquat',
    marcaId: 1,
    name: 'Kumquat',
    tagline: 'El pequeño cítrico que conquistó el Litoral',
    description: [
      'Texto de presentación de la marca: historia, origen del fruto, qué la hace distinta y el espíritu con el que se prepara cada bebida.',
      
    ],
    image: 'images/brands/kumquat.png',
    logo: 'images/brands/kumquat-logo.png',
    logoPosition: 'center 42%',
    logoScale: 1.25,
    color: '#d08a3a',
    colorSoft: '#f4e4cc',
    colorText: '#6e4614',
  },
  {
    slug: 'enlatados',
    marcaId: 2,
    name: 'Enlatados',
    tagline: 'Cóctel enlatado, listo para tomar con mucho hielo',
    description: [
      'De la tierra al cóctel: los tragos que servimos en nuestras barras, preparados con ingredientes entrerrianos y envasados en latas de 473 ml.',
      'Abrís, servís con mucho hielo y listo. Para llevar a la costa, al río o a la mesa, sin perder la receta del cantinero.',
    ],
    image: 'images/brands/enlatados.png',
    imagePosition: 'center 80%',
    logo: 'images/brands/enlatados-logo.png',
    color: '#6e9951',
    colorSoft: '#dfe9d6',
    colorText: '#34502a',
  },
  {
    slug: 'bolazo',
    marcaId: 3,
    name: 'Bolazo',
    tagline: 'La sangría entrerriana, ahora en lata',
    description: [
      'Para nosotros no es un cóctel más: de los miles que elaboramos cada año en eventos y barras, la sangría es el más elegido por la gente en estos 11 años.',
      'Quisimos hacer una versión propia, con mucha identidad entrerriana, y darle valor agregado a los vinos de Entre Ríos para acercarlos a la gente desde otra perspectiva.',
      'Bolazo es una marca producida por Cantinero Entrerriano y hoy la envasamos en latas para que la disfrutes donde sea, no solo donde estén nuestras cantinas. Seguimos apostando por la producción local: vinos de viñedos entrerrianos e ingredientes regionales.',
    ],
    image: 'images/brands/bolazo-logo.png',
    logo: 'images/brands/bolazo-logo.png',
    background: 'images/brands/bolazo-fondo.png',
    color: '#d96b5e',
    colorSoft: '#f8e0da',
    colorText: '#6b2a22',
  },
];

export function findBrand(slug: string | null | undefined): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}
