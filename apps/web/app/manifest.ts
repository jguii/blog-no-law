import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Manifesto do site (D-03): declara o ícone do app de 512 (`public/brand/icon-512.png`) e o de 180
// (`app/apple-icon.png`), gerados por `scripts/brand/icons.mjs`. `display: 'browser'` porque o blog
// não é um app instalável; o manifesto só dá nome e ícone a quem o adiciona à tela inicial.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.clan,
    description: SITE.description,
    lang: 'pt-BR',
    start_url: '/',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
