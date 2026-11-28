import type { Metadata, Viewport } from 'next';

// Identidade do site em um lugar só: o layout, o rodapé e os metadados leem daqui.
// O 02-12 acrescenta `metadataBase` e `openGraph` neste mesmo arquivo.
export const SITE = {
  name: 'Blog No Law',
  clan: 'No Law',
  slogan: 'Uma nova face, uma nova história.',
  foundedYear: 2017,
  description: 'O blog do clã No Law: desde 2017, a história do clã em posts, fotos e vídeos.',
} as const;

// "<página> | Blog No Law" nas páginas internas; "Blog No Law" sozinho onde não há título próprio.
export const siteMetadata: Metadata = {
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

// A faixa do topo é preta nos dois temas, então a barra do navegador também.
export const siteViewport: Viewport = {
  themeColor: '#000000',
};

// Esqueleto do RED (02-12): a implementação real vem no commit GREEN.
export function resolveSiteUrl(_raw: string | undefined): URL {
  return new URL('http://esqueleto.invalid');
}
