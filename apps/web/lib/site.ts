import type { Metadata, Viewport } from 'next';

// Identidade do site em um lugar só: o layout, o rodapé e os metadados leem daqui.
export const SITE = {
  name: 'Blog No Law',
  clan: 'No Law',
  slogan: 'Uma nova face, uma nova história.',
  foundedYear: 2017,
  description: 'O blog do clã No Law: desde 2017, a história do clã em posts, fotos e vídeos.',
} as const;

const DEFAULT_SITE_URL = 'https://blog-no-law.vercel.app';

// Base das URLs absolutas (og:image, canonical). Só uma URL `https:` válida passa; ausente, vazia,
// com outro protocolo ou malformada, cai no domínio fixo de produção, sem quebrar o build (T-02-10).
export function resolveSiteUrl(raw: string | undefined): URL {
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === 'https:') return url;
    } catch {
      // valor que não é URL: usa o padrão
    }
  }
  return new URL(DEFAULT_SITE_URL);
}

// "<página> | Blog No Law" nas páginas internas; "Blog No Law" sozinho onde não há título próprio.
// As imagens do Open Graph vêm da convenção de arquivo (`app/opengraph-image.jpg`); o `metadataBase`
// as torna absolutas.
export const siteMetadata: Metadata = {
  metadataBase: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: 'pt_BR', type: 'website' },
};

// A faixa do topo é preta nos dois temas, então a barra do navegador também.
export const siteViewport: Viewport = {
  themeColor: '#000000',
};
